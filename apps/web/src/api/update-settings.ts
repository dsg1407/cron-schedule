import { api } from '@/lib/api-client'
import type { UserProfile } from './get-profile'

export interface UpdateSettingsBody {
  name?: string
  defaultTimezone?: string
  defaultTimeoutMs?: number
  defaultMaxRetries?: number
  retentionDays?: number
}

export interface UpdateSettingsResponse {
  user: UserProfile
}

export async function updateSettings(body: UpdateSettingsBody): Promise<UpdateSettingsResponse> {
  const response = await api.patch<UpdateSettingsResponse>('/api/me/settings', body)
  return response.data
}
