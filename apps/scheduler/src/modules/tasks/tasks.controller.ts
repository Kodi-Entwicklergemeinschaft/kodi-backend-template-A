import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto';

@ApiTags('tasks')
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({
    summary: 'List all schedules',
    description: 'Retrieve all scheduled tasks ordered by creation date',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of schedules' })
  async findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get schedule by ID',
    description: 'Retrieve a specific schedule by its ID',
  })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Schedule details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Schedule not found' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new schedule',
    description: 'Create a new scheduled task with cron expression',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Schedule created successfully' })
  async create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Post(':id/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually run a schedule',
    description:
      'Trigger a schedule to run immediately without modifying its cron configuration. The schedule will execute once and create a run log entry.',
  })
  @ApiParam({ name: 'id', description: 'Schedule ID to run' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule executed successfully',
    schema: {
      type: 'object',
      properties: {
        schedule: {
          type: 'object',
          description: 'The schedule that was executed',
        },
        runLog: {
          type: 'object',
          nullable: true,
          description:
            'The run log entry created for this execution, including detailed runSummary',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Schedule not found' })
  async runSchedule(@Param('id') id: string) {
    return this.tasksService.runById(id);
  }

  @Get(':id/runs')
  @ApiOperation({
    summary: 'Get run history for a schedule',
    description:
      'Retrieve recent execution logs for a specific schedule, including detailed run summaries',
  })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of run logs to return (default: 20)',
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Run history for the schedule',
    schema: {
      type: 'object',
      properties: {
        schedule: {
          type: 'object',
          description: 'The schedule details',
        },
        runLogs: {
          type: 'array',
          description: 'List of run log entries ordered by creation date (newest first)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              scheduleId: { type: 'string' },
              startedAt: { type: 'string', format: 'date-time' },
              finishedAt: { type: 'string', format: 'date-time', nullable: true },
              status: { type: 'string' },
              runSummary: { type: 'object', nullable: true },
              errorMessage: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: {
          type: 'number',
          description: 'Number of run logs returned',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Schedule not found' })
  async getRunHistory(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tasksService.getRunHistory(id, limit);
  }
}
