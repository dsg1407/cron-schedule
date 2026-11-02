export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type CronJobStatus = 'active' | 'paused'
export type CronJobIcon = 'database' | 'mail' | 'trash' | 'chart' | 'refresh' | 'globe'
export type ExecutionOutcome = 'success' | 'failed' | 'running'

export interface CronJob {
  id: string
  userId: string
  name: string
  description: string | null
  icon: CronJobIcon
  url: string
  method: HttpMethod
  headers: Record<string, string>
  body: string | null
  cronExpression: string
  timezone: string
  timeoutMs: number
  maxRetries: number
  status: CronJobStatus
  lastRunAt: string | null
  nextRunAt: string | null
  lastStatus: ExecutionOutcome | null
  lastDurationMs: number | null
  createdAt: string
  updatedAt: string
}
