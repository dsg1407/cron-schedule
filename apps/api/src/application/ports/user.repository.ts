import type { User } from '../../domain/entities/user.entity.js'

export interface UserRepository {
  findById(userId: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(user: User): Promise<User>
  update(user: User): Promise<User>
}
