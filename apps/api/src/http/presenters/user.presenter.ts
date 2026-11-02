import type { User } from '../../domain/entities/user.entity.js'

export function presentUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    defaultTimezone: user.defaultTimezone,
    defaultTimeoutMs: user.defaultTimeoutMs,
    defaultMaxRetries: user.defaultMaxRetries,
    retentionDays: user.retentionDays,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
