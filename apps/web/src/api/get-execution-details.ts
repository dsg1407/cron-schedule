import { api } from '@/lib/api-client'
import type { ExecutionLogItem } from './get-executions'

export interface GetExecutionDetailsParams {
  executionId: string
}

export interface GetExecutionDetailsResponse {
  execution: ExecutionLogItem
}

export async function getExecutionDetails({
  executionId,
}: GetExecutionDetailsParams): Promise<GetExecutionDetailsResponse> {
  const response = await api.get<GetExecutionDetailsResponse>(`/api/executions/${executionId}`)
  return response.data
}
