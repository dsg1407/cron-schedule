export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  defaultTimezone: string
  defaultTimeoutMs: number
  defaultMaxRetries: number
  retentionDays: number
  createdAt: string
  updatedAt: string
}
