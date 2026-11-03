import type { HttpMethod } from '../../domain/entities/cron-job.entity.js'

export interface ExecuteHttpRequestInput {
  url: string
  method: HttpMethod
  headers: Record<string, string>
  body: string | null
  timeoutMs: number
  maxRetries: number
}

export interface ExecuteHttpRequestOutput {
  success: boolean
  httpStatusCode: number | null
  durationMs: number
  responseHeaders: Record<string, string>
  responseBody: string | null
  errorMessage: string | null
  attemptCount: number
}

export interface HttpExecutorPort {
  validateTargetUrl(url: string): Promise<void> | void
  executeRequest(input: ExecuteHttpRequestInput): Promise<ExecuteHttpRequestOutput>
}
