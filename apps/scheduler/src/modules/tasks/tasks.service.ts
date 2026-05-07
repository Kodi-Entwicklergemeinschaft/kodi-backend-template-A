import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaSchedulerService } from '@kodi/prisma';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { RedisService } from '@kodi/redis';
import { LoggerService } from '@kodi/logger';
import { CreateTaskDto } from './dto';
import { firstValueFrom, timeout } from 'rxjs';
import { computeNextRun, isValidCronExpression } from './cron.helper';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaSchedulerService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly redis: RedisService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(TasksService.name);
  }

  async onModuleInit() {
    this.logger.log('Scheduler service initialized');
    await this.backfillNextRunForExistingSchedules();
  }

  /**
   * Backfill nextRun for existing enabled schedules that have null nextRun
   * This ensures schedules created before this feature was added will work correctly
   */
  private async backfillNextRunForExistingSchedules() {
    try {
      const schedulesNeedingBackfill = await this.prisma.schedule.findMany({
        where: {
          isEnabled: true,
          nextRun: null,
        },
      });

      if (schedulesNeedingBackfill.length === 0) {
        this.logger.debug('No schedules need nextRun backfill');
        return;
      }

      this.logger.log(
        `Backfilling nextRun for ${schedulesNeedingBackfill.length} existing schedule(s)`,
      );

      const now = new Date();
      let successCount = 0;
      let errorCount = 0;

      for (const schedule of schedulesNeedingBackfill) {
        try {
          const nextRun = computeNextRun(schedule.cronExpression, now);
          await this.prisma.schedule.update({
            where: { id: schedule.id },
            data: { nextRun },
          });
          this.logger.debug(
            `Backfilled nextRun for schedule "${schedule.name}" (${schedule.id}): ${nextRun.toISOString()}`,
          );
          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to backfill nextRun for schedule "${schedule.name}" (${schedule.id}) with cron "${schedule.cronExpression}": ${error instanceof Error ? error.message : String(error)}`,
          );
          errorCount++;
        }
      }

      this.logger.log(`Backfill complete: ${successCount} succeeded, ${errorCount} failed`);
    } catch (error) {
      this.logger.error('Error during nextRun backfill', error);
      // Don't throw - allow service to start even if backfill fails
    }
  }

  // Cron job - runs every hour to check for due schedules
  @Cron(CronExpression.EVERY_MINUTE)
  async handleHourlyTasks() {
    const lockKey = 'scheduler:hourly:lock';
    const acquired = await this.redis.acquireLock(lockKey, 300);

    if (!acquired) {
      this.logger.warn('Could not acquire lock for hourly tasks');
      return;
    }

    try {
      const now = new Date();
      this.logger.log('Checking for due scheduled tasks');

      // Fetch only schedules that are enabled and due (nextRun <= now, or null as fallback)
      const tasks = await this.prisma.schedule.findMany({
        where: {
          isEnabled: true,
          OR: [{ nextRun: { lte: now } }, { nextRun: null }],
        },
      });

      this.logger.log(`Found ${tasks.length} due schedule(s) to execute`);

      for (const task of tasks) {
        await this.executeTask(task);
      }
    } finally {
      await this.redis.releaseLock(lockKey);
    }
  }

  async findAll() {
    return this.prisma.schedule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.schedule.findUnique({ where: { id } });
  }

  async create(dto: CreateTaskDto) {
    // Validate cron expression
    if (!isValidCronExpression(dto.cronExpression)) {
      throw new Error(`Invalid cron expression: ${dto.cronExpression}`);
    }

    // Compute next run time
    const nextRun = computeNextRun(dto.cronExpression);

    const task = await this.prisma.schedule.create({
      data: {
        name: dto.name,
        description: dto.description,
        cronExpression: dto.cronExpression,
        payload: dto.payload || {},
        isEnabled: true,
        nextRun,
      },
    });

    this.logger.log(`Task created: ${task.id} (next run: ${nextRun.toISOString()})`);
    return task;
  }

  /**
   * Manually trigger a schedule to run immediately
   * Does not modify the cron configuration - only executes the task once
   */
  async runById(id: string) {
    const task = await this.prisma.schedule.findUnique({ where: { id } });

    if (!task) {
      throw new Error(`Schedule with id ${id} not found`);
    }

    this.logger.log(`Manually triggering schedule: ${task.name} (${id})`);

    // Execute the task (this will create a run log and update schedule stats)
    await this.executeTask(task);

    // Fetch the latest run log for this schedule
    const latestRunLog = await this.prisma.scheduleRunLog.findFirst({
      where: { scheduleId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      schedule: task,
      runLog: latestRunLog || null,
    };
  }

  /**
   * Get run history for a schedule
   */
  async getRunHistory(scheduleId: string, limit: number = 20) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error(`Schedule with id ${scheduleId} not found`);
    }

    const runLogs = await this.prisma.scheduleRunLog.findMany({
      where: { scheduleId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      schedule,
      runLogs,
      total: runLogs.length,
    };
  }

  private async executeTask(task: any) {
    this.logger.log(`Executing task: ${task.name}`);

    const executionStartTime = new Date();
    let runLog: any;
    let executionResult: any = null;
    let taskType: string = 'unknown';

    // Create schedule run log
    try {
      runLog = await this.prisma.scheduleRunLog.create({
        data: {
          scheduleId: task.id,
          startedAt: executionStartTime,
          status: 'SUCCESS', // Will be updated if it fails
        },
      });
      this.logger.debug(`Created schedule run log: ${runLog.id} for task: ${task.id}`);
    } catch (error) {
      this.logger.error(`Failed to create schedule run log for task: ${task.id}`, error);
      // Continue execution even if log creation fails
    }

    try {
      // Check task kind to route to appropriate handler
      if (task.payload && task.payload.kind === 'favorite-event-reminders') {
        taskType = 'favorite-event-reminders';
        this.logger.log(
          `Task ${task.name} is favorite-event-reminders, triggering reminder processing`,
        );

        // Use send() to wait for response and capture results
        try {
          executionResult = await firstValueFrom(
            this.client
              .send<{ sent24h: number; sent2h: number }>(
                RabbitMQPatterns.LISTING_FAVORITE_REMINDERS_RUN,
                {
                  taskId: task.id,
                  scheduleRunId: runLog?.id,
                  triggeredAt: executionStartTime.toISOString(),
                },
              )
              .pipe(timeout(300000)), // 5 minute timeout
          );
          this.logger.debug(
            `Favorite reminders completed: ${executionResult.sent24h} 24h reminders, ${executionResult.sent2h} 2h reminders`,
          );
        } catch (error) {
          this.logger.error('Failed to get response from favorite reminders handler', error);
          throw error;
        }
      } else if (task.payload && task.payload.kind === 'expire-events-cleanup') {
        taskType = 'expire-events-cleanup';
        this.logger.log(
          `Task ${task.name} is expire-events-cleanup, triggering expired event listing deletion`,
        );

        try {
          executionResult = await firstValueFrom(
            this.client
              .send<{ deleted: number; skipped: number }>(RabbitMQPatterns.LISTING_EXPIRE_CLEANUP, {
                taskId: task.id,
                scheduleRunId: runLog?.id,
                triggeredAt: executionStartTime.toISOString(),
              })
              .pipe(timeout(300000)), // 5 minute timeout
          );
          this.logger.debug(
            `Expire events cleanup completed: ${executionResult.deleted} deleted, ${executionResult.skipped} skipped`,
          );
        } catch (error) {
          this.logger.error('Failed to get response from expire events cleanup handler', error);
          throw error;
        }
      } else {
        taskType = 'default';
        // Default task execution
        this.client.emit(RabbitMQPatterns.SCHEDULE_EXECUTE, {
          taskId: task.id,
          scheduleRunId: runLog?.id,
          name: task.name,
          payload: task.payload,
          timestamp: executionStartTime.toISOString(),
        });
        executionResult = { message: 'Task executed (fire-and-forget)' };
      }

      const executionEndTime = new Date();
      const executionDuration = executionEndTime.getTime() - executionStartTime.getTime();

      // Compute next run time based on cron expression
      let nextRun: Date | null = null;
      try {
        nextRun = computeNextRun(task.cronExpression, executionEndTime);
      } catch (error) {
        this.logger.error(
          `Failed to compute next run for task ${task.id} with cron "${task.cronExpression}": ${error instanceof Error ? error.message : String(error)}`,
        );
        // If cron parsing fails, set nextRun to null to prevent infinite retries
        // The startup backfill will attempt to fix it on next service restart
      }

      // Update schedule with last run info and next run time
      await this.prisma.schedule.update({
        where: { id: task.id },
        data: {
          lastRun: executionEndTime,
          lastRunStatus: 'SUCCESS',
          runCount: { increment: 1 },
          nextRun: nextRun || undefined,
        },
      });

      // Build comprehensive run summary
      const runSummary: any = {
        taskType,
        taskName: task.name,
        executionStartTime: executionStartTime.toISOString(),
        executionEndTime: executionEndTime.toISOString(),
        executionDurationMs: executionDuration,
        executionDurationSeconds: Math.round(executionDuration / 1000),
        status: 'SUCCESS',
        completed: true,
      };

      // Add task-specific results
      if (executionResult) {
        if (taskType === 'favorite-event-reminders') {
          runSummary.reminders = {
            sent24h: executionResult.sent24h || 0,
            sent2h: executionResult.sent2h || 0,
            total: (executionResult.sent24h || 0) + (executionResult.sent2h || 0),
          };
        } else if (taskType === 'expire-events-cleanup') {
          runSummary.cleanup = {
            deleted: executionResult.deleted || 0,
            skipped: executionResult.skipped || 0,
            total: (executionResult.deleted || 0) + (executionResult.skipped || 0),
          };
        } else {
          runSummary.result = executionResult;
        }
      }

      // Add task payload metadata (excluding sensitive data)
      if (task.payload) {
        const payloadCopy = { ...task.payload };
        // Remove sensitive fields if present
        delete payloadCopy.apiKey;
        delete payloadCopy.password;
        delete payloadCopy.secret;
        runSummary.payload = payloadCopy;
      }

      // Update run log with detailed success status
      if (runLog) {
        await this.prisma.scheduleRunLog.update({
          where: { id: runLog.id },
          data: {
            finishedAt: executionEndTime,
            status: 'SUCCESS',
            runSummary,
          },
        });
      }

      // Emit schedule completed event (fire-and-forget, no handler required)
      // This event can be used for monitoring/logging in the future
      try {
        this.client.emit(RabbitMQPatterns.SCHEDULE_COMPLETED, {
          taskId: task.id,
          scheduleRunId: runLog?.id,
          status: 'SUCCESS',
          timestamp: executionEndTime.toISOString(),
        });
      } catch (error) {
        // Silently ignore if no handler exists - this is expected for fire-and-forget events
        this.logger.debug(`Schedule completed event emitted (no handler required): ${task.id}`);
      }
    } catch (error) {
      const executionEndTime = new Date();
      const executionDuration = executionEndTime.getTime() - executionStartTime.getTime();

      this.logger.error(`Task execution failed: ${task.name}`, error);

      // Compute next run time even on failure (so the task can retry later)
      let nextRun: Date | null = null;
      try {
        nextRun = computeNextRun(task.cronExpression, executionEndTime);
      } catch (error) {
        this.logger.error(
          `Failed to compute next run for failed task ${task.id} with cron "${task.cronExpression}": ${error instanceof Error ? error.message : String(error)}`,
        );
        // If cron parsing fails, nextRun remains null
        // The startup backfill will attempt to fix it on next service restart
      }

      // Update schedule with failure info and next run time
      await this.prisma.schedule.update({
        where: { id: task.id },
        data: {
          lastRun: executionEndTime,
          lastRunStatus: 'FAILED',
          nextRun: nextRun || undefined,
        },
      });

      // Build comprehensive error summary
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'UnknownError';

      const runSummary: any = {
        taskType,
        taskName: task.name,
        executionStartTime: executionStartTime.toISOString(),
        executionEndTime: executionEndTime.toISOString(),
        executionDurationMs: executionDuration,
        executionDurationSeconds: Math.round(executionDuration / 1000),
        status: 'FAILED',
        error: true,
        errorName,
        errorMessage,
      };

      if (errorStack) {
        runSummary.errorStack = errorStack;
      }

      // Add partial results if available
      if (executionResult) {
        runSummary.partialResult = executionResult;
      }

      // Add task payload metadata (excluding sensitive data)
      if (task.payload) {
        const payloadCopy = { ...task.payload };
        delete payloadCopy.apiKey;
        delete payloadCopy.password;
        delete payloadCopy.secret;
        runSummary.payload = payloadCopy;
      }

      // Update run log with detailed failure status
      if (runLog) {
        await this.prisma.scheduleRunLog.update({
          where: { id: runLog.id },
          data: {
            finishedAt: executionEndTime,
            status: 'FAILED',
            errorMessage,
            runSummary,
          },
        });
      }
    }
  }
}
