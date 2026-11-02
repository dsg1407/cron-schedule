import { api } from '@/lib/api-client'
import type { CronJobItem, CronJobStatus } from './get-cron-jobs'

export interface ToggleCronJobStatusParams {
  cronJobId: string
  status?: CronJobStatus
}

export interface ToggleCronJobStatusResponse {
  cronJob: CronJobItem
}

export async function toggleCronJobStatus({
  cronJobId,
  status,
}: ToggleCronJobStatusParams): Promise<ToggleCronJobStatusResponse> {
  const response = await api.patch<ToggleCronJobStatusResponse>(
    `/api/cron-jobs/${cronJobId}/status`,
    { status },
  )
  return response.data
}
