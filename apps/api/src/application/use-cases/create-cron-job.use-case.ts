import type {
  CronJob,
  CronJobIcon,
  CronJobStatus,
  HttpMethod,
} from '../../domain/entities/cron-job.entity.js'
import { InvalidCronExpressionError } from '../../domain/errors.js'
import { newId } from '../../domain/new-id.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'
import type { HttpExecutorPort } from '../ports/http-executor.port.js'
import type { ScheduledJobCallback, SchedulerPort } from '../ports/scheduler.port.js'

export interface CreateCronJobUseCaseRequest {
  userId: string
  name: string
  description?: string | null
  icon?: CronJobIcon
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: string | null
  cronExpression: string
  timezone?: string
  timeoutMs?: number
  maxRetries?: number
  status?: CronJobStatus
}

export interface CreateCronJobUseCaseResponse {
  cronJob: CronJob
}

export class CreateCronJobUseCase {
  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly scheduler: SchedulerPort,
    private readonly httpExecutor: HttpExecutorPort,
    private readonly onScheduledTrigger?: ScheduledJobCallback,
  ) {}

  async execute(input: CreateCronJobUseCaseRequest): Promise<CreateCronJobUseCaseResponse> {
    const timezone = input.timezone ?? 'America/Sao_Paulo'
    const cronExpression = input.cronExpression.trim()

    this.httpExecutor.validateTargetUrl(input.url)

    const isCronValid = this.scheduler.validateCronExpression(cronExpression, timezone)
    if (!isCronValid) {
      throw new InvalidCronExpressionError(cronExpression)
    }

    const status: CronJobStatus = input.status ?? 'active'
    const nextRunAt =
      status === 'active' ? this.scheduler.getNextRunIso(cronExpression, timezone) : null
    const nowIso = new Date().toISOString()

    const cronJob = await this.cronJobRepository.create({
      id: newId(),
      userId: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      icon: input.icon ?? 'globe',
      url: input.url.trim(),
      method: input.method,
      headers: input.headers ?? {},
      body: input.body ?? null,
      cronExpression,
      timezone,
      timeoutMs: input.timeoutMs ?? 30000,
      maxRetries: input.maxRetries ?? 1,
      status,
      lastRunAt: null,
      nextRunAt,
      lastStatus: null,
      lastDurationMs: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    })

    if (cronJob.status === 'active' && this.onScheduledTrigger) {
      this.scheduler.scheduleJob(cronJob, this.onScheduledTrigger)
    }

    return { cronJob }
  }
}
