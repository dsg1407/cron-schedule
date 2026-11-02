import type { UserRepository } from '../../src/application/ports/user.repository.js'
import type { User } from '../../src/domain/entities/user.entity.js'

export class InMemoryUserRepository implements UserRepository {
  public items: User[] = []

  async findById(userId: string): Promise<User | null> {
    return this.items.find((user) => user.id === userId) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((user) => user.email === email) ?? null
  }

  async create(user: User): Promise<User> {
    this.items.push(user)
    return user
  }

  async update(user: User): Promise<User> {
    const itemIndex = this.items.findIndex((existing) => existing.id === user.id)
    if (itemIndex >= 0) {
      this.items[itemIndex] = user
    }
    return user
  }
}
