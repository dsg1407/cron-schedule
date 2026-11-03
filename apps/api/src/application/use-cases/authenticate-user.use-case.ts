import type { User } from '../../domain/entities/user.entity.js'
import { InvalidCredentialsError } from '../../domain/errors.js'
import type { PasswordHasherPort } from '../ports/password-hasher.port.js'
import type { UserRepository } from '../ports/user.repository.js'

export interface AuthenticateUserUseCaseRequest {
  email: string
  password: string
}

export interface AuthenticateUserUseCaseResponse {
  user: User
}

const DUMMY_SCRYPT_HASH =
  '00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateUserUseCaseRequest): Promise<AuthenticateUserUseCaseResponse> {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await this.userRepository.findByEmail(normalizedEmail)

    if (!user) {
      // Execute dummy scrypt verification to equalize execution time and prevent user enumeration
      await this.passwordHasher.verify(password, DUMMY_SCRYPT_HASH)
      throw new InvalidCredentialsError()
    }

    const isPasswordValid = await this.passwordHasher.verify(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    return { user }
  }
}
