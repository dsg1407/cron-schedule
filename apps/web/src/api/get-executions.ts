import { api } from '@/lib/api-client'
import type { CronJobIcon, ExecutionOutcome, HttpMethod } from './get-cron-jobs'

export type TriggerType = 'scheduled' | 'manual'

export interface ExecutionLogItem {
  id: string
  cronJobId: string
  cronJobName?: string
  cronJobIcon?: CronJobIcon
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

export interface GetExecutionsQuery {
  cronJobId?: string | null
  status?: ExecutionOutcome | null
  triggerType?: TriggerType | null
  search?: string | null
  pageIndex?: number | null
  perPage?: number | null
}

export interface GetExecutionsResponse {
  executions: ExecutionLogItem[]
  meta: {
    pageIndex: number
    perPage: number
    totalCount: number
  }
}

export async function getExecutions({
  cronJobId,
  status,
  triggerType,
  search,
  pageIndex = 0,
  perPage = 20,
}: GetExecutionsQuery = {}): Promise<GetExecutionsResponse> {
  const response = await api.get<GetExecutionsResponse>('/api/executions', {
    params: {
      cronJobId: cronJobId || undefined,
      status: status || undefined,
      triggerType: triggerType || undefined,
      search: search || undefined,
      pageIndex,
      perPage,
    },
  })
  return response.data
}
