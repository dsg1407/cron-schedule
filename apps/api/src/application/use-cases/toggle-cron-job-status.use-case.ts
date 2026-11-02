import type { CronJob, CronJobStatus } from '../../domain/entities/cron-job.entity.js'
import { CronJobNotFoundError } from '../../domain/errors.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'
import type { ScheduledJobCallback, SchedulerPort } from '../ports/scheduler.port.js'

export interface ToggleCronJobStatusUseCaseRequest {
  cronJobId: string
  userId: string
  status?: CronJobStatus
}

export interface ToggleCronJobStatusUseCaseResponse {
  cronJob: CronJob
}

export class ToggleCronJobStatusUseCase {
  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly scheduler: SchedulerPort,
    private readonly onScheduledTrigger?: ScheduledJobCallback,
  ) {}

  async execute({
    cronJobId,
    userId,
    status,
  }: ToggleCronJobStatusUseCaseRequest): Promise<ToggleCronJobStatusUseCaseResponse> {
    const existingCronJob = await this.cronJobRepository.findByIdForUser(cronJobId, userId)

    if (!existingCronJob) {
      throw new CronJobNotFoundError(cronJobId)
    }

    const nextStatus: CronJobStatus =
      status ?? (existingCronJob.status === 'active' ? 'paused' : 'active')

    const nextRunAt =
      nextStatus === 'active'
        ? this.scheduler.getNextRunIso(existingCronJob.cronExpression, existingCronJob.timezone)
        : null

    const updatedCronJob = await this.cronJobRepository.update({
      ...existingCronJob,
      status: nextStatus,
      nextRunAt,
      updatedAt: new Date().toISOString(),
    })

    this.scheduler.unscheduleJob(updatedCronJob.id)
    if (updatedCronJob.status === 'active' && this.onScheduledTrigger) {
      this.scheduler.scheduleJob(updatedCronJob, this.onScheduledTrigger)
    }

    return { cronJob: updatedCronJob }
  }
}
