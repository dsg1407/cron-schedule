import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import type {
  CronJobRepository,
  ListCronJobsFilters,
  ListCronJobsResult,
} from '../../../application/ports/cron-job.repository.js'
import type {
  CronJob,
  CronJobIcon,
  CronJobStatus,
  ExecutionOutcome,
  HttpMethod,
} from '../../../domain/entities/cron-job.entity.js'
import type { PostgresDatabase } from './client.js'
import { cronJobs } from './schema.js'

type CronJobRow = typeof cronJobs.$inferSelect

function parseHeadersJson(headersJson: string): Record<string, string> {
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

export function mapPgCronJobRow(row: CronJobRow): CronJob {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    icon: row.icon as CronJobIcon,
    url: row.url,
    method: row.method as HttpMethod,
    headers: parseHeadersJson(row.headersJson),
    body: row.body,
    cronExpression: row.cronExpression,
    timezone: row.timezone,
    timeoutMs: row.timeoutMs,
    maxRetries: row.maxRetries,
    status: row.status as CronJobStatus,
    lastRunAt: row.lastRunAt,
    nextRunAt: row.nextRunAt,
    lastStatus: (row.lastStatus as ExecutionOutcome | null) ?? null,
    lastDurationMs: row.lastDurationMs,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class DrizzlePgCronJobRepository implements CronJobRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async findByIdForUser(cronJobId: string, userId: string): Promise<CronJob | null> {
    const [row] = await this.db
      .select()
      .from(cronJobs)
      .where(and(eq(cronJobs.id, cronJobId), eq(cronJobs.userId, userId)))
      .limit(1)

    return row ? mapPgCronJobRow(row) : null
  }

  async findById(cronJobId: string): Promise<CronJob | null> {
    const [row] = await this.db.select().from(cronJobs).where(eq(cronJobs.id, cronJobId)).limit(1)
    return row ? mapPgCronJobRow(row) : null
  }

  async findAllActive(): Promise<CronJob[]> {
    const rows = await this.db.select().from(cronJobs).where(eq(cronJobs.status, 'active'))
    return rows.map((row) => mapPgCronJobRow(row))
  }

  async listForUser({
    userId,
    search,
    status,
    pageIndex = 0,
    perPage = 20,
  }: ListCronJobsFilters): Promise<ListCronJobsResult> {
    const conditions = [eq(cronJobs.userId, userId)]

    if (status) {
      conditions.push(eq(cronJobs.status, status))
    }

    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`
      const searchCondition = or(
        ilike(cronJobs.name, pattern),
        ilike(cronJobs.description, pattern),
        ilike(cronJobs.url, pattern),
      )
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    const whereClause = and(...conditions)

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(cronJobs)
        .where(whereClause)
        .orderBy(desc(cronJobs.createdAt))
        .limit(perPage)
        .offset(pageIndex * perPage),
      this.db.select({ total: count() }).from(cronJobs).where(whereClause),
    ])

    return {
      cronJobs: rows.map((row) => mapPgCronJobRow(row)),
      totalCount: Number(totalRows[0]?.total ?? 0),
    }
  }

  async countForUser(userId: string): Promise<number> {
    const rows = await this.db
      .select({ total: count() })
      .from(cronJobs)
      .where(eq(cronJobs.userId, userId))

    return Number(rows[0]?.total ?? 0)
  }

  async create(cronJob: CronJob): Promise<CronJob> {
    await this.db.insert(cronJobs).values({
      id: cronJob.id,
      userId: cronJob.userId,
      name: cronJob.name,
      description: cronJob.description,
      icon: cronJob.icon,
      url: cronJob.url,
      method: cronJob.method,
      headersJson: JSON.stringify(cronJob.headers),
      body: cronJob.body,
      cronExpression: cronJob.cronExpression,
      timezone: cronJob.timezone,
      timeoutMs: cronJob.timeoutMs,
      maxRetries: cronJob.maxRetries,
      status: cronJob.status,
      lastRunAt: cronJob.lastRunAt,
      nextRunAt: cronJob.nextRunAt,
      lastStatus: cronJob.lastStatus,
      lastDurationMs: cronJob.lastDurationMs,
      createdAt: cronJob.createdAt,
      updatedAt: cronJob.updatedAt,
    })

    return cronJob
  }

  async update(cronJob: CronJob): Promise<CronJob> {
    await this.db
      .update(cronJobs)
      .set({
        name: cronJob.name,
        description: cronJob.description,
        icon: cronJob.icon,
        url: cronJob.url,
        method: cronJob.method,
        headersJson: JSON.stringify(cronJob.headers),
        body: cronJob.body,
        cronExpression: cronJob.cronExpression,
        timezone: cronJob.timezone,
        timeoutMs: cronJob.timeoutMs,
        maxRetries: cronJob.maxRetries,
        status: cronJob.status,
        lastRunAt: cronJob.lastRunAt,
        nextRunAt: cronJob.nextRunAt,
        lastStatus: cronJob.lastStatus,
        lastDurationMs: cronJob.lastDurationMs,
        updatedAt: cronJob.updatedAt,
      })
      .where(eq(cronJobs.id, cronJob.id))

    return cronJob
  }

  async deleteForUser(cronJobId: string, userId: string): Promise<boolean> {
    const existing = await this.findByIdForUser(cronJobId, userId)
    if (!existing) {
      return false
    }

    await this.db
      .delete(cronJobs)
      .where(and(eq(cronJobs.id, cronJobId), eq(cronJobs.userId, userId)))

    return true
  }
}

