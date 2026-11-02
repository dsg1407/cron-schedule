import type {
  ExecuteHttpRequestInput,
  ExecuteHttpRequestOutput,
  HttpExecutorPort,
} from '../../src/application/ports/http-executor.port.js'
import type { PasswordHasherPort } from '../../src/application/ports/password-hasher.port.js'
import { ForbiddenTargetUrlError } from '../../src/domain/errors.js'

export class FakeHttpExecutor implements HttpExecutorPort {
  public nextResult: ExecuteHttpRequestOutput = {
    success: true,
    httpStatusCode: 200,
    durationMs: 142,
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: '{"ok":true}',
    errorMessage: null,
    attemptCount: 1,
  }

  public executedInputs: ExecuteHttpRequestInput[] = []

  validateTargetUrl(url: string): void {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      throw new ForbiddenTargetUrlError('URL inválida.')
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new ForbiddenTargetUrlError('Protocolo não permitido.')
    }
  }

  async executeRequest(input: ExecuteHttpRequestInput): Promise<ExecuteHttpRequestOutput> {
    this.validateTargetUrl(input.url)
    this.executedInputs.push(input)
    return this.nextResult
  }
}

export class FakePasswordHasher implements PasswordHasherPort {
  async hash(plainPassword: string): Promise<string> {
    return `hashed:${plainPassword}`
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hashed:${plainPassword}`
  }
}
