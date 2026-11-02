import { api } from '@/lib/api-client'

export interface DeleteCronJobParams {
  cronJobId: string
}

export async function deleteCronJob({ cronJobId }: DeleteCronJobParams): Promise<void> {
  await api.delete(`/api/cron-jobs/${cronJobId}`)
}
