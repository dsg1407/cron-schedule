import { api } from '@/lib/api-client'
import type { ExecutionLogItem } from './get-executions'

export interface DashboardHourlyPoint {
  hourLabel: string
  executionsCount: number
  successRatePercent: number
  averageDurationMs: number
}

export interface DashboardSummary {
  totalCronJobs: number
  activeCronJobs: number
  executionsLast24h: number
  successRatePercent: number
  averageDurationMs: number
  hourlySeries: DashboardHourlyPoint[]
  recentActivity: ExecutionLogItem[]
}

export interface GetDashboardSummaryResponse {
  summary: DashboardSummary
}

export async function getDashboardSummary(): Promise<GetDashboardSummaryResponse> {
  const response = await api.get<GetDashboardSummaryResponse>('/api/dashboard/summary')
  return response.data
}
