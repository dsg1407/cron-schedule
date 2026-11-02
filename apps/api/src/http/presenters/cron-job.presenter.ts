import type { CronJob } from '../../domain/entities/cron-job.entity.js'

export function presentCronJob(cronJob: CronJob) {
  return {
    id: cronJob.id,
    userId: cronJob.userId,
    name: cronJob.name,
    description: cronJob.description,
    icon: cronJob.icon,
    url: cronJob.url,
    method: cronJob.method,
    headers: cronJob.headers,
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
  }
}
