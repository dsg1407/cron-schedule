import { eq } from 'drizzle-orm'
import type { UserRepository } from '../../../application/ports/user.repository.js'
import type { User } from '../../../domain/entities/user.entity.js'
import type { SqliteDatabase } from './client.js'
import { users } from './schema.js'

type UserRow = typeof users.$inferSelect

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    defaultTimezone: row.defaultTimezone,
    defaultTimeoutMs: row.defaultTimeoutMs,
    defaultMaxRetries: row.defaultMaxRetries,
    retentionDays: row.retentionDays,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async findById(userId: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1)
    return row ? mapUserRow(row) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1)
    return row ? mapUserRow(row) : null
  }

  async create(user: User): Promise<User> {
    await this.db.insert(users).values({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      defaultTimezone: user.defaultTimezone,
      defaultTimeoutMs: user.defaultTimeoutMs,
      defaultMaxRetries: user.defaultMaxRetries,
      retentionDays: user.retentionDays,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })

    return user
  }

  async update(user: User): Promise<User> {
    await this.db
      .update(users)
      .set({
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        defaultTimezone: user.defaultTimezone,
        defaultTimeoutMs: user.defaultTimeoutMs,
        defaultMaxRetries: user.defaultMaxRetries,
        retentionDays: user.retentionDays,
        updatedAt: user.updatedAt,
      })
      .where(eq(users.id, user.id))

    return user
  }
}
