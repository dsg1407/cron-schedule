import { Cron } from 'croner'
import type { ScheduledJobCallback, SchedulerPort } from '../../application/ports/scheduler.port.js'
import type { CronJob } from '../../domain/entities/cron-job.entity.js'

export class CronerSchedulerAdapter implements SchedulerPort {
  private readonly scheduledInstances = new Map<string, Cron>()

  validateCronExpression(cronExpression: string, timezone: string): boolean {
    const trimmed = cronExpression.trim()
    const parts = trimmed.split(/\s+/)
    // Enforce strict 5-field standard POSIX cron (disallow 6-field sub-minute second-level cron)
    if (parts.length !== 5) {
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
    const trimmed = cronExpression.trim()
    const parts = trimmed.split(/\s+/)
    if (parts.length !== 5) {
      return null
    }

    try {
      const probeJob = new Cron(trimmed, { timezone, paused: true })
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

    const trimmed = cronJob.cronExpression.trim()
    const parts = trimmed.split(/\s+/)
    if (parts.length !== 5) {
      return
    }

    const cronInstance = new Cron(
      trimmed,
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
