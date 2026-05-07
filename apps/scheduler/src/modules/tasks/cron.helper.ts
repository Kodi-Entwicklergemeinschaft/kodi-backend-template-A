import CronExpressionParser from 'cron-parser';

/**
 * Compute the next run time for a given cron expression
 * @param cronExpression - Cron expression (e.g., "0 2 * * *" for daily at 2 AM)
 * @param from - Optional date to compute from (defaults to now)
 * @returns Date object representing the next run time
 * @throws Error if cron expression is invalid
 */
export function computeNextRun(cronExpression: string, from?: Date): Date {
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      tz: 'UTC', // Use UTC for consistency
      currentDate: from || new Date(),
    });
    return interval.next().toDate();
  } catch (error) {
    throw new Error(
      `Invalid cron expression "${cronExpression}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Validate a cron expression
 * @param cronExpression - Cron expression to validate
 * @returns true if valid, false otherwise
 */
export function isValidCronExpression(cronExpression: string): boolean {
  try {
    CronExpressionParser.parse(cronExpression);
    return true;
  } catch {
    return false;
  }
}
