import type { ExecutionLog } from '../../domain/entities/execution-log.entity.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'
import type { ExecutionLogRepository } from '../ports/execution-log.repository.js'

export interface DashboardMetricsSummary {
  totalCronJobs: number
  activeCronJobs: number
  executionsLast24h: number
  successRatePercent: number
  averageDurationMs: number
  hourlySeries: {
    hourLabel: string
    executionsCount: number
    successRatePercent: number
    averageDurationMs: number
  }[]
  recentActivity: ExecutionLog[]
}

export interface GetDashboardMetricsUseCaseRequest {
  userId: string
}

export interface GetDashboardMetricsUseCaseResponse {
  summary: DashboardMetricsSummary
}

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly executionLogRepository: ExecutionLogRepository,
  ) {}

  async execute({
    userId,
  }: GetDashboardMetricsUseCaseRequest): Promise<GetDashboardMetricsUseCaseResponse> {
    const now = Date.now()
    const since24hIso = new Date(now - 24 * 60 * 60 * 1000).toISOString()

    const [{ cronJobs, totalCount }, executionsLast24hList, recentExecutionsResult] =
      await Promise.all([
        this.cronJobRepository.listForUser({ userId, pageIndex: 0, perPage: 100 }),
        this.executionLogRepository.listSinceForUser(userId, since24hIso),
        this.executionLogRepository.listForUser({ userId, pageIndex: 0, perPage: 8 }),
      ])

    const activeCronJobs = cronJobs.filter((job) => job.status === 'active').length
    const completedExecutions = executionsLast24hList.filter(
      (execution) => execution.status !== 'running',
    )
    const succeededExecutions = completedExecutions.filter(
      (execution) => execution.status === 'success',
    )

    const executionsLast24h = executionsLast24hList.length
    const successRatePercent =
      completedExecutions.length > 0
        ? Math.round((succeededExecutions.length / completedExecutions.length) * 100)
        : 100

    const totalDurationMs = completedExecutions.reduce(
      (accumulator, execution) => accumulator + (execution.durationMs ?? 0),
      0,
    )
    const averageDurationMs =
      completedExecutions.length > 0 ? Math.round(totalDurationMs / completedExecutions.length) : 0

    const bucketCount = 8
    const bucketDurationMs = (24 * 60 * 60 * 1000) / bucketCount
    const hourlySeries = Array.from({ length: bucketCount }, (_unused, bucketIndex) => {
      const bucketStart = now - (bucketCount - bucketIndex) * bucketDurationMs
      const bucketEnd = bucketStart + bucketDurationMs
      const bucketItems = completedExecutions.filter((execution) => {
        const startedAtMs = new Date(execution.startedAt).getTime()
        return startedAtMs >= bucketStart && startedAtMs < bucketEnd
      })
      const bucketSuccessCount = bucketItems.filter(
        (execution) => execution.status === 'success',
      ).length
      const bucketTotalDuration = bucketItems.reduce(
        (accumulator, execution) => accumulator + (execution.durationMs ?? 0),
        0,
      )

      return {
        hourLabel: new Date(bucketEnd).toISOString().slice(11, 16),
        executionsCount: bucketItems.length,
        successRatePercent:
          bucketItems.length > 0
            ? Math.round((bucketSuccessCount / bucketItems.length) * 100)
            : successRatePercent,
        averageDurationMs:
          bucketItems.length > 0
            ? Math.round(bucketTotalDuration / bucketItems.length)
            : averageDurationMs,
      }
    })

    return {
      summary: {
        totalCronJobs: totalCount,
        activeCronJobs,
        executionsLast24h,
        successRatePercent,
        averageDurationMs,
        hourlySeries,
        recentActivity: recentExecutionsResult.executions,
      },
    }
  }
}
