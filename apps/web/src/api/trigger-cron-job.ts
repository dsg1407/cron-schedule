import { api } from '@/lib/api-client'
import type { CronJobItem } from './get-cron-jobs'
import type { ExecutionLogItem } from './get-executions'

export interface TriggerCronJobParams {
  cronJobId: string
}

export interface TriggerCronJobResponse {
  execution: ExecutionLogItem
  cronJob: CronJobItem
}

export async function triggerCronJob({
  cronJobId,
}: TriggerCronJobParams): Promise<TriggerCronJobResponse> {
  const response = await api.post<TriggerCronJobResponse>(`/api/cron-jobs/${cronJobId}/trigger`)
  return response.data
}
