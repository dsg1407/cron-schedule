import type { CronJob, ExecutionOutcome } from '../../domain/entities/cron-job.entity.js'
import type { ExecutionLog, TriggerType } from '../../domain/entities/execution-log.entity.js'
import { CronJobNotFoundError } from '../../domain/errors.js'
import { newId } from '../../domain/new-id.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'
import type { ExecutionLogRepository } from '../ports/execution-log.repository.js'
import type { HttpExecutorPort } from '../ports/http-executor.port.js'
import type { SchedulerPort } from '../ports/scheduler.port.js'

const MAX_RESPONSE_BODY_LENGTH = 65536

export interface ExecuteCronJobUseCaseRequest {
  cronJobId: string
  userId?: string
  triggerType: TriggerType
}

export interface ExecuteCronJobUseCaseResponse {
  executionLog: ExecutionLog
  cronJob: CronJob
}

export class ExecuteCronJobUseCase {
  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly executionLogRepository: ExecutionLogRepository,
    private readonly httpExecutor: HttpExecutorPort,
    private readonly scheduler: SchedulerPort,
  ) {}

  async execute({
    cronJobId,
    userId,
    triggerType,
  }: ExecuteCronJobUseCaseRequest): Promise<ExecuteCronJobUseCaseResponse> {
    const cronJob = userId
      ? await this.cronJobRepository.findByIdForUser(cronJobId, userId)
      : await this.cronJobRepository.findById(cronJobId)

    if (!cronJob) {
      throw new CronJobNotFoundError(cronJobId)
    }

    const startedAt = new Date().toISOString()

    const initialExecutionLog = await this.executionLogRepository.create({
      id: newId(),
      cronJobId: cronJob.id,
      cronJobName: cronJob.name,
      cronJobIcon: cronJob.icon,
      userId: cronJob.userId,
      triggerType,
      status: 'running',
      requestUrl: cronJob.url,
      requestMethod: cronJob.method,
      requestHeaders: cronJob.headers,
      requestBody: cronJob.body,
      httpStatusCode: null,
      durationMs: null,
      responseHeaders: {},
      responseBody: null,
      errorMessage: null,
      attemptCount: 1,
      startedAt,
      finishedAt: null,
    })

    const executionResult = await this.httpExecutor.executeRequest({
      url: cronJob.url,
      method: cronJob.method,
      headers: cronJob.headers,
      body: cronJob.body,
      timeoutMs: cronJob.timeoutMs,
      maxRetries: cronJob.maxRetries,
    })

    const finishedAt = new Date().toISOString()
    const finalStatus: ExecutionOutcome = executionResult.success ? 'success' : 'failed'

    const truncatedBody =
      executionResult.responseBody && executionResult.responseBody.length > MAX_RESPONSE_BODY_LENGTH
        ? `${executionResult.responseBody.slice(0, MAX_RESPONSE_BODY_LENGTH)}\n...[truncated at 64KB]`
        : executionResult.responseBody

    const completedExecutionLog = await this.executionLogRepository.update({
      ...initialExecutionLog,
      status: finalStatus,
      httpStatusCode: executionResult.httpStatusCode,
      durationMs: executionResult.durationMs,
      responseHeaders: executionResult.responseHeaders,
      responseBody: truncatedBody,
      errorMessage: executionResult.errorMessage,
      attemptCount: executionResult.attemptCount,
      finishedAt,
    })

    const nextRunAt =
      cronJob.status === 'active'
        ? this.scheduler.getNextRunIso(cronJob.cronExpression, cronJob.timezone)
        : null

    const updatedCronJob = await this.cronJobRepository.update({
      ...cronJob,
      lastRunAt: startedAt,
      nextRunAt,
      lastStatus: finalStatus,
      lastDurationMs: executionResult.durationMs,
      updatedAt: finishedAt,
    })

    return {
      executionLog: {
        ...completedExecutionLog,
        cronJobName: cronJob.name,
        cronJobIcon: cronJob.icon,
      },
      cronJob: updatedCronJob,
    }
  }
}
