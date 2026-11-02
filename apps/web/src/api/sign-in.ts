import { api } from '@/lib/api-client'
import type { UserProfile } from './get-profile'

export interface SignInBody {
  email: string
  password: string
}

export interface SignInResponse {
  token: string
  user: UserProfile
}

export async function signIn({ email, password }: SignInBody): Promise<SignInResponse> {
  const response = await api.post<SignInResponse>('/api/auth/login', {
    email,
    password,
  })
  return response.data
}
