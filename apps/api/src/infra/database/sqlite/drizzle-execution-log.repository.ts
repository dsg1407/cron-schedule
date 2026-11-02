import { and, count, desc, eq, gte, inArray, like, lt, or } from 'drizzle-orm'
import type {
  ExecutionLogRepository,
  ListExecutionsFilters,
  ListExecutionsResult,
} from '../../../application/ports/execution-log.repository.js'
import type { ExecutionOutcome, HttpMethod } from '../../../domain/entities/cron-job.entity.js'
import type { ExecutionLog, TriggerType } from '../../../domain/entities/execution-log.entity.js'
import type { SqliteDatabase } from './client.js'
import { cronJobs, executionLogs } from './schema.js'

type ExecutionLogRow = typeof executionLogs.$inferSelect

function parseHeaders(headersJson: string): Record<string, string> {
  try {
    const parsed = JSON.parse(headersJson) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
    return {}
  } catch {
    return {}
  }
}

export function mapExecutionLogRow(
  row: ExecutionLogRow,
  jobMeta?: { name: string; icon: string },
): ExecutionLog {
  return {
    id: row.id,
    cronJobId: row.cronJobId,
    cronJobName: jobMeta?.name,
    cronJobIcon: jobMeta?.icon,
    userId: row.userId,
    triggerType: row.triggerType as TriggerType,
    status: row.status as ExecutionOutcome,
    requestUrl: row.requestUrl,
    requestMethod: row.requestMethod as HttpMethod,
    requestHeaders: parseHeaders(row.requestHeadersJson),
    requestBody: row.requestBody,
    httpStatusCode: row.httpStatusCode,
    durationMs: row.durationMs,
    responseHeaders: parseHeaders(row.responseHeadersJson),
    responseBody: row.responseBody,
    errorMessage: row.errorMessage,
    attemptCount: row.attemptCount,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
  }
}

export class DrizzleExecutionLogRepository implements ExecutionLogRepository {
  constructor(private readonly db: SqliteDatabase) {}

  private async attachJobMetadata(rows: ExecutionLogRow[]): Promise<ExecutionLog[]> {
    if (rows.length === 0) {
      return []
    }

    const cronJobIds = Array.from(new Set(rows.map((row) => row.cronJobId)))
    const jobRows = await this.db
      .select({ id: cronJobs.id, name: cronJobs.name, icon: cronJobs.icon })
      .from(cronJobs)
      .where(inArray(cronJobs.id, cronJobIds))

    const jobMap = new Map(jobRows.map((jobRow) => [jobRow.id, jobRow]))

    return rows.map((row) => {
      const jobMeta = jobMap.get(row.cronJobId)
      return mapExecutionLogRow(row, jobMeta)
    })
  }

  async findByIdForUser(executionId: string, userId: string): Promise<ExecutionLog | null> {
    const [row] = await this.db
      .select()
      .from(executionLogs)
      .where(and(eq(executionLogs.id, executionId), eq(executionLogs.userId, userId)))
      .limit(1)

    if (!row) {
      return null
    }

    const [enriched] = await this.attachJobMetadata([row])
    return enriched ?? null
  }

  async listForUser({
    userId,
    cronJobId,
    status,
    triggerType,
    search,
    pageIndex = 0,
    perPage = 20,
  }: ListExecutionsFilters): Promise<ListExecutionsResult> {
    const conditions = [eq(executionLogs.userId, userId)]

    if (cronJobId) {
      conditions.push(eq(executionLogs.cronJobId, cronJobId))
    }

    if (status) {
      conditions.push(eq(executionLogs.status, status))
    }

    if (triggerType) {
      conditions.push(eq(executionLogs.triggerType, triggerType))
    }

    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`
      const matchingJobRows = await this.db
        .select({ id: cronJobs.id })
        .from(cronJobs)
        .where(and(eq(cronJobs.userId, userId), like(cronJobs.name, pattern)))

      const matchingJobIds = matchingJobRows.map((jobRow) => jobRow.id)
      const searchCondition =
        matchingJobIds.length > 0
          ? or(
              like(executionLogs.requestUrl, pattern),
              like(executionLogs.errorMessage, pattern),
              inArray(executionLogs.cronJobId, matchingJobIds),
            )
          : or(like(executionLogs.requestUrl, pattern), like(executionLogs.errorMessage, pattern))

      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    const whereClause = and(...conditions)

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(executionLogs)
        .where(whereClause)
        .orderBy(desc(executionLogs.startedAt))
        .limit(perPage)
        .offset(pageIndex * perPage),
      this.db.select({ total: count() }).from(executionLogs).where(whereClause),
    ])

    const executions = await this.attachJobMetadata(rows)

    return {
      executions,
      totalCount: totalRows[0]?.total ?? 0,
    }
  }

  async listSinceForUser(userId: string, sinceIso: string): Promise<ExecutionLog[]> {
    const rows = await this.db
      .select()
      .from(executionLogs)
      .where(and(eq(executionLogs.userId, userId), gte(executionLogs.startedAt, sinceIso)))
      .orderBy(desc(executionLogs.startedAt))

    return this.attachJobMetadata(rows)
  }

  async create(executionLog: ExecutionLog): Promise<ExecutionLog> {
    await this.db.insert(executionLogs).values({
      id: executionLog.id,
      cronJobId: executionLog.cronJobId,
      userId: executionLog.userId,
      triggerType: executionLog.triggerType,
      status: executionLog.status,
      requestUrl: executionLog.requestUrl,
      requestMethod: executionLog.requestMethod,
      requestHeadersJson: JSON.stringify(executionLog.requestHeaders),
      requestBody: executionLog.requestBody,
      httpStatusCode: executionLog.httpStatusCode,
      durationMs: executionLog.durationMs,
      responseHeadersJson: JSON.stringify(executionLog.responseHeaders),
      responseBody: executionLog.responseBody,
      errorMessage: executionLog.errorMessage,
      attemptCount: executionLog.attemptCount,
      startedAt: executionLog.startedAt,
      finishedAt: executionLog.finishedAt,
    })

    return executionLog
  }

  async update(executionLog: ExecutionLog): Promise<ExecutionLog> {
    await this.db
      .update(executionLogs)
      .set({
        status: executionLog.status,
        httpStatusCode: executionLog.httpStatusCode,
        durationMs: executionLog.durationMs,
        responseHeadersJson: JSON.stringify(executionLog.responseHeaders),
        responseBody: executionLog.responseBody,
        errorMessage: executionLog.errorMessage,
        attemptCount: executionLog.attemptCount,
        finishedAt: executionLog.finishedAt,
      })
      .where(eq(executionLogs.id, executionLog.id))

    return executionLog
  }

  async deleteOlderThanForUser(userId: string, beforeIso: string): Promise<number> {
    const rowsToDelete = await this.db
      .select({ id: executionLogs.id })
      .from(executionLogs)
      .where(and(eq(executionLogs.userId, userId), lt(executionLogs.startedAt, beforeIso)))

    if (rowsToDelete.length === 0) {
      return 0
    }

    await this.db
      .delete(executionLogs)
      .where(and(eq(executionLogs.userId, userId), lt(executionLogs.startedAt, beforeIso)))

    return rowsToDelete.length
  }
}
