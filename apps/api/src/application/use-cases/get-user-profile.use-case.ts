import type { User } from '../../domain/entities/user.entity.js'
import { UserNotFoundError } from '../../domain/errors.js'
import type { UserRepository } from '../ports/user.repository.js'

export interface GetUserProfileUseCaseRequest {
  userId: string
}

export interface GetUserProfileUseCaseResponse {
  user: User
}

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ userId }: GetUserProfileUseCaseRequest): Promise<GetUserProfileUseCaseResponse> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    return { user }
  }
}
