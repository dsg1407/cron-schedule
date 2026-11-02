import { api } from '@/lib/api-client'
import type { CronJobIcon, CronJobItem, CronJobStatus, HttpMethod } from './get-cron-jobs'

export interface CreateCronJobBody {
  name: string
  description?: string | null
  icon?: CronJobIcon
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: string | null
  cronExpression: string
  timezone?: string
  timeoutMs?: number
  maxRetries?: number
  status?: CronJobStatus
}

export interface CreateCronJobResponse {
  cronJob: CronJobItem
}

export async function createCronJob(body: CreateCronJobBody): Promise<CreateCronJobResponse> {
  const response = await api.post<CreateCronJobResponse>('/api/cron-jobs', body)
  return response.data
}
