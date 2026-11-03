import { beforeEach, describe, expect, it } from 'vitest'
import { AuthenticateUserUseCase } from '../../../../src/application/use-cases/authenticate-user.use-case.js'
import { GetUserProfileUseCase } from '../../../../src/application/use-cases/get-user-profile.use-case.js'
import { RegisterUserUseCase } from '../../../../src/application/use-cases/register-user.use-case.js'
import { UpdateUserSettingsUseCase } from '../../../../src/application/use-cases/update-user-settings.use-case.js'
import { InvalidCredentialsError, UserAlreadyExistsError } from '../../../../src/domain/errors.js'
import { FakePasswordHasher } from '../../../helpers/fake-http-executor.js'
import { InMemoryUserRepository } from '../../../helpers/in-memory-user.repository.js'

describe('User Auth and Profile Use Cases', () => {
  let userRepository: InMemoryUserRepository
  let passwordHasher: FakePasswordHasher
  let registerUserUseCase: RegisterUserUseCase
  let authenticateUserUseCase: AuthenticateUserUseCase
  let getUserProfileUseCase: GetUserProfileUseCase
  let updateUserSettingsUseCase: UpdateUserSettingsUseCase

  beforeEach(() => {
    userRepository = new InMemoryUserRepository()
    passwordHasher = new FakePasswordHasher()
    registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher)
    authenticateUserUseCase = new AuthenticateUserUseCase(userRepository, passwordHasher)
    getUserProfileUseCase = new GetUserProfileUseCase(userRepository)
    updateUserSettingsUseCase = new UpdateUserSettingsUseCase(userRepository)
  })

  it('registers a new user and normalizes email', async () => {
    const { user } = await registerUserUseCase.execute({
      name: 'Diego Goncalves',
      email: '  Diego@CronFlow.dev ',
      password: 'password123',
    })

    expect(user.id).toBeTruthy()
    expect(user.email).toBe('diego@cronflow.dev')
    expect(user.defaultTimezone).toBe('America/Sao_Paulo')
  })

  it('rejects duplicate user email registration', async () => {
    await registerUserUseCase.execute({
      name: 'Diego',
      email: 'diego@cronflow.dev',
      password: 'password123',
    })

    await expect(
      registerUserUseCase.execute({
        name: 'Another User',
        email: 'diego@cronflow.dev',
        password: 'password456',
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })

  it('authenticates valid credentials and rejects invalid password', async () => {
    await registerUserUseCase.execute({
      name: 'Diego',
      email: 'diego@cronflow.dev',
      password: 'password123',
    })

    const { user } = await authenticateUserUseCase.execute({
      email: 'diego@cronflow.dev',
      password: 'password123',
    })

    expect(user.email).toBe('diego@cronflow.dev')

    await expect(
      authenticateUserUseCase.execute({
        email: 'diego@cronflow.dev',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('updates user default job settings and retention policy', async () => {
    const { user: createdUser } = await registerUserUseCase.execute({
      name: 'Diego',
      email: 'diego@cronflow.dev',
      password: 'password123',
    })

    const { user: updatedUser } = await updateUserSettingsUseCase.execute({
      userId: createdUser.id,
      name: 'Diego G.',
      defaultTimeoutMs: 15000,
      defaultMaxRetries: 3,
      retentionDays: 90,
    })

    expect(updatedUser.name).toBe('Diego G.')
    expect(updatedUser.defaultTimeoutMs).toBe(15000)
    expect(updatedUser.defaultMaxRetries).toBe(3)
    expect(updatedUser.retentionDays).toBe(90)

    const { user: profileUser } = await getUserProfileUseCase.execute({
      userId: createdUser.id,
    })
    expect(profileUser.retentionDays).toBe(90)
  })

  it('mitigates timing attacks by executing dummy password verification when user is not found', async () => {
    let verifyCalled = false
    let verifiedHash = ''
    passwordHasher.verify = async (_plain, hash) => {
      verifyCalled = true
      verifiedHash = hash
      return false
    }

    await expect(
      authenticateUserUseCase.execute({
        email: 'nonexistent@cronflow.dev',
        password: 'any-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)

    expect(verifyCalled).toBe(true)
    expect(verifiedHash).toContain(':')
  })
})
