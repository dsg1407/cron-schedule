import { beforeEach, describe, expect, it } from 'vitest'
import { ExecuteCronJobUseCase } from '../../../../src/application/use-cases/execute-cron-job.use-case.js'
import { GetDashboardMetricsUseCase } from '../../../../src/application/use-cases/get-dashboard-metrics.use-case.js'
import { PurgeOldExecutionsUseCase } from '../../../../src/application/use-cases/purge-old-executions.use-case.js'
import { FakeHttpExecutor } from '../../../helpers/fake-http-executor.js'
import { FakeScheduler } from '../../../helpers/fake-scheduler.js'
import { InMemoryCronJobRepository } from '../../../helpers/in-memory-cron-job.repository.js'
import { InMemoryExecutionLogRepository } from '../../../helpers/in-memory-execution-log.repository.js'
import { makeCronJobFixture, makeExecutionLogFixture } from '../../../helpers/make-fixtures.js'

describe('ExecuteCronJob, DashboardMetrics and PurgeExecutions Use Cases', () => {
  let cronJobRepository: InMemoryCronJobRepository
  let executionLogRepository: InMemoryExecutionLogRepository
  let httpExecutor: FakeHttpExecutor
  let scheduler: FakeScheduler
  let executeCronJobUseCase: ExecuteCronJobUseCase
  let getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  let purgeOldExecutionsUseCase: PurgeOldExecutionsUseCase

  beforeEach(() => {
    cronJobRepository = new InMemoryCronJobRepository()
    executionLogRepository = new InMemoryExecutionLogRepository()
    httpExecutor = new FakeHttpExecutor()
    scheduler = new FakeScheduler()

    executeCronJobUseCase = new ExecuteCronJobUseCase(
      cronJobRepository,
      executionLogRepository,
      httpExecutor,
      scheduler,
    )
    getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
      cronJobRepository,
      executionLogRepository,
    )
    purgeOldExecutionsUseCase = new PurgeOldExecutionsUseCase(executionLogRepository)
  })

  it('executes a cron job, records response headers/body, and updates job lastStatus', async () => {
    const job = makeCronJobFixture({
      userId: 'user-1',
      name: 'Sync External API',
      headers: { 'X-Webhook-Secret': 'abc' },
    })
    await cronJobRepository.create(job)

    httpExecutor.nextResult = {
      success: true,
      httpStatusCode: 201,
      durationMs: 315,
      responseHeaders: { 'x-request-id': 'req-99' },
      responseBody: '{"synced":42}',
      errorMessage: null,
      attemptCount: 1,
    }

    const { executionLog, cronJob: updatedJob } = await executeCronJobUseCase.execute({
      cronJobId: job.id,
      userId: 'user-1',
      triggerType: 'manual',
    })

    expect(executionLog.status).toBe('success')
    expect(executionLog.httpStatusCode).toBe(201)
    expect(executionLog.responseBody).toBe('{"synced":42}')
    expect(executionLog.responseHeaders['x-request-id']).toBe('req-99')
    expect(updatedJob.lastStatus).toBe('success')
    expect(updatedJob.lastDurationMs).toBe(315)
  })

  it('truncates response bodies larger than 64KB to protect SQLite storage', async () => {
    const job = makeCronJobFixture({ userId: 'user-1' })
    await cronJobRepository.create(job)

    const hugeBody = 'A'.repeat(70000)
    httpExecutor.nextResult = {
      success: true,
      httpStatusCode: 200,
      durationMs: 500,
      responseHeaders: {},
      responseBody: hugeBody,
      errorMessage: null,
      attemptCount: 1,
    }

    const { executionLog } = await executeCronJobUseCase.execute({
      cronJobId: job.id,
      userId: 'user-1',
      triggerType: 'scheduled',
    })

    expect(executionLog.responseBody?.length).toBeLessThan(66000)
    expect(executionLog.responseBody).toContain('...[truncated at 64KB]')
  })

  it('computes dashboard metrics and purges executions older than retention cutoff', async () => {
    const job = makeCronJobFixture({ userId: 'user-1', status: 'active' })
    await cronJobRepository.create(job)

    const recentDateIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const oldDateIso = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()

    await executionLogRepository.create(
      makeExecutionLogFixture({
        userId: 'user-1',
        cronJobId: job.id,
        status: 'success',
        durationMs: 200,
        startedAt: recentDateIso,
      }),
    )
    await executionLogRepository.create(
      makeExecutionLogFixture({
        userId: 'user-1',
        cronJobId: job.id,
        status: 'failed',
        durationMs: 400,
        startedAt: recentDateIso,
      }),
    )
    await executionLogRepository.create(
      makeExecutionLogFixture({
        userId: 'user-1',
        cronJobId: job.id,
        status: 'success',
        durationMs: 100,
        startedAt: oldDateIso,
      }),
    )

    const { summary } = await getDashboardMetricsUseCase.execute({ userId: 'user-1' })

    expect(summary.totalCronJobs).toBe(1)
    expect(summary.executionsLast24h).toBe(2)
    expect(summary.successRatePercent).toBe(50)
    expect(summary.averageDurationMs).toBe(300)
    expect(summary.recentActivity).toHaveLength(3)

    const { deletedCount } = await purgeOldExecutionsUseCase.execute({
      userId: 'user-1',
      olderThanDays: 30,
    })

    expect(deletedCount).toBe(1)
    expect(executionLogRepository.items).toHaveLength(2)
  })
})
