import type { User } from '../../domain/entities/user.entity.js'
import { UserNotFoundError } from '../../domain/errors.js'
import type { UserRepository } from '../ports/user.repository.js'

export interface UpdateUserSettingsUseCaseRequest {
  userId: string
  name?: string
  defaultTimezone?: string
  defaultTimeoutMs?: number
  defaultMaxRetries?: number
  retentionDays?: number
}

export interface UpdateUserSettingsUseCaseResponse {
  user: User
}

export class UpdateUserSettingsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    userId,
    name,
    defaultTimezone,
    defaultTimeoutMs,
    defaultMaxRetries,
    retentionDays,
  }: UpdateUserSettingsUseCaseRequest): Promise<UpdateUserSettingsUseCaseResponse> {
    const existingUser = await this.userRepository.findById(userId)

    if (!existingUser) {
      throw new UserNotFoundError(userId)
    }

    const updatedUser = await this.userRepository.update({
      ...existingUser,
      name: name !== undefined ? name.trim() : existingUser.name,
      defaultTimezone: defaultTimezone ?? existingUser.defaultTimezone,
      defaultTimeoutMs: defaultTimeoutMs ?? existingUser.defaultTimeoutMs,
      defaultMaxRetries: defaultMaxRetries ?? existingUser.defaultMaxRetries,
      retentionDays: retentionDays ?? existingUser.retentionDays,
      updatedAt: new Date().toISOString(),
    })

    return { user: updatedUser }
  }
}
