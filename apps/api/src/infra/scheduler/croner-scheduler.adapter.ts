import { Cron } from 'croner'
import type { ScheduledJobCallback, SchedulerPort } from '../../application/ports/scheduler.port.js'
import type { CronJob } from '../../domain/entities/cron-job.entity.js'

export class CronerSchedulerAdapter implements SchedulerPort {
  private readonly scheduledInstances = new Map<string, Cron>()

  validateCronExpression(cronExpression: string, timezone: string): boolean {
    const trimmed = cronExpression.trim()
    const parts = trimmed.split(/\s+/)
    if (parts.length < 5 || parts.length > 6) {
      return false
    }

    try {
      const probeJob = new Cron(trimmed, { timezone, paused: true })
      const nextDate = probeJob.nextRun()
      probeJob.stop()
      return nextDate !== null
    } catch {
      return false
    }
  }

  getNextRunIso(cronExpression: string, timezone: string): string | null {
    try {
      const probeJob = new Cron(cronExpression.trim(), { timezone, paused: true })
      const nextDate = probeJob.nextRun()
      probeJob.stop()
      return nextDate ? nextDate.toISOString() : null
    } catch {
      return null
    }
  }

  scheduleJob(cronJob: CronJob, onTrigger: ScheduledJobCallback): void {
    this.unscheduleJob(cronJob.id)

    if (cronJob.status !== 'active') {
      return
    }

    const cronInstance = new Cron(
      cronJob.cronExpression,
      {
        timezone: cronJob.timezone,
        protect: true,
        catch: true,
      },
      async () => {
        await onTrigger(cronJob.id)
      },
    )

    this.scheduledInstances.set(cronJob.id, cronInstance)
  }

  unscheduleJob(cronJobId: string): void {
    const existingInstance = this.scheduledInstances.get(cronJobId)
    if (existingInstance) {
      existingInstance.stop()
      this.scheduledInstances.delete(cronJobId)
    }
  }

  stopAll(): void {
    for (const [cronJobId, instance] of this.scheduledInstances.entries()) {
      instance.stop()
      this.scheduledInstances.delete(cronJobId)
    }
  }
}
