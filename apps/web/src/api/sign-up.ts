import { api } from '@/lib/api-client'
import type { UserProfile } from './get-profile'

export interface SignUpBody {
  name: string
  email: string
  password: string
}

export interface SignUpResponse {
  token: string
  user: UserProfile
}

export async function signUp({ name, email, password }: SignUpBody): Promise<SignUpResponse> {
  const response = await api.post<SignUpResponse>('/api/auth/register', {
    name,
    email,
    password,
  })
  return response.data
}
