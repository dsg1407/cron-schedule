import { api } from '@/lib/api-client'

export interface UserProfile {
  id: string
  name: string
  email: string
  defaultTimezone: string
  defaultTimeoutMs: number
  defaultMaxRetries: number
  retentionDays: number
  createdAt: string
  updatedAt: string
}

export interface GetProfileResponse {
  user: UserProfile
}

export async function getProfile(): Promise<GetProfileResponse> {
  const response = await api.get<GetProfileResponse>('/api/me')
  return response.data
}
