import { api } from '@/lib/api-client'
import type { CronJobIcon, CronJobItem, CronJobStatus, HttpMethod } from './get-cron-jobs'

export interface UpdateCronJobBody {
  cronJobId: string
  name?: string
  description?: string | null
  icon?: CronJobIcon
  url?: string
  method?: HttpMethod
  headers?: Record<string, string>
  body?: string | null
  cronExpression?: string
  timezone?: string
  timeoutMs?: number
  maxRetries?: number
  status?: CronJobStatus
}

export interface UpdateCronJobResponse {
  cronJob: CronJobItem
}

export async function updateCronJob({
  cronJobId,
  ...payload
}: UpdateCronJobBody): Promise<UpdateCronJobResponse> {
  const response = await api.put<UpdateCronJobResponse>(`/api/cron-jobs/${cronJobId}`, payload)
  return response.data
}
