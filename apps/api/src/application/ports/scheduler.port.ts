import type { CronJob } from '../../domain/entities/cron-job.entity.js'

export type ScheduledJobCallback = (cronJobId: string) => Promise<void>

export interface SchedulerPort {
  validateCronExpression(cronExpression: string, timezone: string): boolean
  getNextRunIso(cronExpression: string, timezone: string): string | null
  scheduleJob(cronJob: CronJob, onTrigger: ScheduledJobCallback): void
  unscheduleJob(cronJobId: string): void
  stopAll(): void
}
