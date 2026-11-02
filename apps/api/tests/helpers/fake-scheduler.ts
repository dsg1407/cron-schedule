import type {
  ScheduledJobCallback,
  SchedulerPort,
} from '../../src/application/ports/scheduler.port.js'
import type { CronJob } from '../../src/domain/entities/cron-job.entity.js'

export class FakeScheduler implements SchedulerPort {
  public scheduledJobs = new Map<string, { cronJob: CronJob; callback: ScheduledJobCallback }>()

  validateCronExpression(cronExpression: string, _timezone: string): boolean {
    const parts = cronExpression.trim().split(/\s+/)
    if (parts.length !== 5) {
      return false
    }
    return !cronExpression.includes('invalid')
  }

  getNextRunIso(cronExpression: string, timezone: string): string | null {
    if (!this.validateCronExpression(cronExpression, timezone)) {
      return null
    }
    return new Date(Date.now() + 60 * 60 * 1000).toISOString()
  }

  scheduleJob(cronJob: CronJob, onTrigger: ScheduledJobCallback): void {
    this.scheduledJobs.set(cronJob.id, { cronJob, callback: onTrigger })
  }

  unscheduleJob(cronJobId: string): void {
    this.scheduledJobs.delete(cronJobId)
  }

  stopAll(): void {
    this.scheduledJobs.clear()
  }
}
