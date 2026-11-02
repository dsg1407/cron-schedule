import { api } from '@/lib/api-client'

export interface PurgeExecutionsParams {
  olderThanDays: number
}

export interface PurgeExecutionsResponse {
  deletedCount: number
}

export async function purgeExecutions({
  olderThanDays,
}: PurgeExecutionsParams): Promise<PurgeExecutionsResponse> {
  const response = await api.delete<PurgeExecutionsResponse>('/api/executions/purge', {
    params: { olderThanDays },
  })
  return response.data
}
