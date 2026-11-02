import type {
  CronJob,
  CronJobIcon,
  CronJobStatus,
  HttpMethod,
} from '../../domain/entities/cron-job.entity.js'
import { CronJobNotFoundError, InvalidCronExpressionError } from '../../domain/errors.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'
import type { HttpExecutorPort } from '../ports/http-executor.port.js'
import type { ScheduledJobCallback, SchedulerPort } from '../ports/scheduler.port.js'

export interface UpdateCronJobUseCaseRequest {
  cronJobId: string
  userId: string
  name?: string
  description?: string | null
  icon?: CronJobIcon
  url?: string
  method?: HttpMethod
  headers?: Record<string, string>
  body?: string | null
  cronExpression?: string
  timezone?: string
  timeoutMs?: number
  maxRetries?: number
  status?: CronJobStatus
}

export interface UpdateCronJobUseCaseResponse {
  cronJob: CronJob
}

export class UpdateCronJobUseCase {
  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly scheduler: SchedulerPort,
    private readonly httpExecutor: HttpExecutorPort,
    private readonly onScheduledTrigger?: ScheduledJobCallback,
  ) {}

  async execute(input: UpdateCronJobUseCaseRequest): Promise<UpdateCronJobUseCaseResponse> {
    const existingCronJob = await this.cronJobRepository.findByIdForUser(
      input.cronJobId,
      input.userId,
    )

    if (!existingCronJob) {
      throw new CronJobNotFoundError(input.cronJobId)
    }

    const updatedUrl = input.url !== undefined ? input.url.trim() : existingCronJob.url
    this.httpExecutor.validateTargetUrl(updatedUrl)

    const updatedCronExpression =
      input.cronExpression !== undefined
        ? input.cronExpression.trim()
        : existingCronJob.cronExpression
    const updatedTimezone = input.timezone ?? existingCronJob.timezone

    const isCronValid = this.scheduler.validateCronExpression(
      updatedCronExpression,
      updatedTimezone,
    )
    if (!isCronValid) {
      throw new InvalidCronExpressionError(updatedCronExpression)
    }

    const updatedStatus = input.status ?? existingCronJob.status
    const nextRunAt =
      updatedStatus === 'active'
        ? this.scheduler.getNextRunIso(updatedCronExpression, updatedTimezone)
        : null

    const updatedCronJob = await this.cronJobRepository.update({
      ...existingCronJob,
      name: input.name !== undefined ? input.name.trim() : existingCronJob.name,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : existingCronJob.description,
      icon: input.icon ?? existingCronJob.icon,
      url: updatedUrl,
      method: input.method ?? existingCronJob.method,
      headers: input.headers ?? existingCronJob.headers,
      body: input.body !== undefined ? input.body : existingCronJob.body,
      cronExpression: updatedCronExpression,
      timezone: updatedTimezone,
      timeoutMs: input.timeoutMs ?? existingCronJob.timeoutMs,
      maxRetries: input.maxRetries ?? existingCronJob.maxRetries,
      status: updatedStatus,
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
