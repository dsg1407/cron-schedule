import type { ExecutionOutcome, HttpMethod } from './cron-job.entity.js'

export type TriggerType = 'scheduled' | 'manual'

export interface ExecutionLog {
  id: string
  cronJobId: string
  cronJobName?: string
  cronJobIcon?: string
  userId: string
  triggerType: TriggerType
  status: ExecutionOutcome
  requestUrl: string
  requestMethod: HttpMethod
  requestHeaders: Record<string, string>
  requestBody: string | null
  httpStatusCode: number | null
  durationMs: number | null
  responseHeaders: Record<string, string>
  responseBody: string | null
  errorMessage: string | null
  attemptCount: number
  startedAt: string
  finishedAt: string | null
}
