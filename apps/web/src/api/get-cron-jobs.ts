import { api } from '@/lib/api-client'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type CronJobStatus = 'active' | 'paused'
export type CronJobIcon = 'database' | 'mail' | 'trash' | 'chart' | 'refresh' | 'globe'
export type ExecutionOutcome = 'success' | 'failed' | 'running'

export interface CronJobItem {
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

export interface GetCronJobsQuery {
  search?: string | null
  status?: CronJobStatus | null
  pageIndex?: number | null
  perPage?: number | null
}

export interface GetCronJobsResponse {
  cronJobs: CronJobItem[]
  meta: {
    pageIndex: number
    perPage: number
    totalCount: number
  }
}

export async function getCronJobs({
  search,
  status,
  pageIndex = 0,
  perPage = 20,
}: GetCronJobsQuery = {}): Promise<GetCronJobsResponse> {
  const response = await api.get<GetCronJobsResponse>('/api/cron-jobs', {
    params: {
      search: search || undefined,
      status: status || undefined,
      pageIndex,
      perPage,
    },
  })
  return response.data
}
