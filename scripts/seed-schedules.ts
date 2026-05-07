#!/usr/bin/env ts-node
/**
 * Seed script: Default Schedules
 *
 * Creates default scheduled tasks in the scheduler database.
 * This includes:
 * - favorite-event-reminders: Hourly task to send push notifications for favorite events
 *   (24h and 2h before event start)
 * - expire-events-cleanup: Daily hard-delete of event listings with all occurrences in the past
 *   (runs daily at 2 AM UTC)
 *
 * Usage:
 *   npm run seed:schedules
 *   or
 *   ts-node scripts/seed-schedules.ts
 */

import 'tsconfig-paths/register';
import { PrismaClient as SchedulerPrismaClient } from '@prisma/client-scheduler';

const schedulerPrisma = new SchedulerPrismaClient();

interface ScheduleDefinition {
  name: string;
  description: string;
  cronExpression: string;
  payload: any;
  isEnabled: boolean;
}

const defaultSchedules: ScheduleDefinition[] = [
  {
    name: 'Favorite Event Reminders',
    description:
      'Sends push notifications to users for their favorite events - 24 hours and 2 hours before event start. Runs hourly to check for upcoming events.',
    cronExpression: '*/5 * * * *', // Every hour at minute 0
    payload: {
      kind: 'favorite-event-reminders',
    },
    isEnabled: true,
  },
  {
    name: 'Expire Events Cleanup',
    description:
      'Hard-deletes event listings whose last possible occurrence is in the past. Evaluates eventEnd, time interval end dates, and repeatUntil for recurring events. Runs daily at 2 AM UTC.',
    cronExpression: '0 2 * * *',
    payload: {
      kind: 'expire-events-cleanup',
    },
    isEnabled: true,
  },
];

async function seed() {
  console.log('🌱 Seeding default schedules...');

  for (const scheduleDef of defaultSchedules) {
    // Check if schedule already exists by name
    const existing = await schedulerPrisma.schedule.findFirst({
      where: { name: scheduleDef.name },
      select: { id: true, isEnabled: true },
    });

    if (existing) {
      // Update existing schedule
      const updated = await schedulerPrisma.schedule.update({
        where: { id: existing.id },
        data: {
          description: scheduleDef.description,
          cronExpression: scheduleDef.cronExpression,
          payload: scheduleDef.payload,
          isEnabled: scheduleDef.isEnabled,
        },
        select: { id: true, name: true, updatedAt: true },
      });
      console.log(
        `↻ Updated schedule: "${updated.name}" (${updated.id}) - Enabled: ${scheduleDef.isEnabled}`,
      );
    } else {
      // Create new schedule
      const created = await schedulerPrisma.schedule.create({
        data: {
          name: scheduleDef.name,
          description: scheduleDef.description,
          cronExpression: scheduleDef.cronExpression,
          payload: scheduleDef.payload,
          isEnabled: scheduleDef.isEnabled,
        },
        select: { id: true, name: true, createdAt: true },
      });
      console.log(
        `✓ Created schedule: "${created.name}" (${created.id}) - Enabled: ${scheduleDef.isEnabled}`,
      );
    }
  }

  console.log('✅ Seeding complete.');
  console.log('\n📋 Summary of schedules:');
  const allSchedules = await schedulerPrisma.schedule.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      cronExpression: true,
      isEnabled: true,
      payload: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const schedule of allSchedules) {
    console.log(`\n  • ${schedule.name}`);
    console.log(`    ID: ${schedule.id}`);
    console.log(`    Cron: ${schedule.cronExpression}`);
    console.log(`    Enabled: ${schedule.isEnabled}`);
    console.log(`    Payload: ${JSON.stringify(schedule.payload)}`);
  }
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await schedulerPrisma.$disconnect();
  });
