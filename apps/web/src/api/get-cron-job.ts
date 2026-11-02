import { api } from '@/lib/api-client'
import type { CronJobItem } from './get-cron-jobs'

export interface GetCronJobParams {
  cronJobId: string
}

export interface GetCronJobResponse {
  cronJob: CronJobItem
}

export async function getCronJob({ cronJobId }: GetCronJobParams): Promise<GetCronJobResponse> {
  const response = await api.get<GetCronJobResponse>(`/api/cron-jobs/${cronJobId}`)
  return response.data
}
