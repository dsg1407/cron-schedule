import type { User } from '../../domain/entities/user.entity.js'
import { UserAlreadyExistsError } from '../../domain/errors.js'
import { newId } from '../../domain/new-id.js'
import type { PasswordHasherPort } from '../ports/password-hasher.port.js'
import type { UserRepository } from '../ports/user.repository.js'

export interface RegisterUserUseCaseRequest {
  name: string
  email: string
  password: string
}

export interface RegisterUserUseCaseResponse {
  user: User
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute({
    name,
    email,
    password,
  }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await this.userRepository.findByEmail(normalizedEmail)

    if (existingUser) {
      throw new UserAlreadyExistsError(normalizedEmail)
    }

    const passwordHash = await this.passwordHasher.hash(password)
    const nowIso = new Date().toISOString()

    const user = await this.userRepository.create({
      id: newId(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      defaultTimezone: 'America/Sao_Paulo',
      defaultTimeoutMs: 30000,
      defaultMaxRetries: 1,
      retentionDays: 30,
      createdAt: nowIso,
      updatedAt: nowIso,
    })

    return { user }
  }
}
