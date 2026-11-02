import type {
  ExecuteHttpRequestInput,
  ExecuteHttpRequestOutput,
  HttpExecutorPort,
} from '../../application/ports/http-executor.port.js'
import { ForbiddenTargetUrlError } from '../../domain/errors.js'

const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
]

export class FetchHttpExecutorAdapter implements HttpExecutorPort {
  constructor(private readonly allowPrivateNetworks: boolean = true) {}

  validateTargetUrl(url: string): void {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.trim())
    } catch {
      throw new ForbiddenTargetUrlError('Formato de URL inválido.')
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new ForbiddenTargetUrlError('Apenas protocolos HTTP e HTTPS são suportados.')
    }

    if (!this.allowPrivateNetworks) {
      const hostname = parsedUrl.hostname.toLowerCase()
      const isPrivateHost = PRIVATE_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname))
      if (isPrivateHost) {
        throw new ForbiddenTargetUrlError(
          'Hosts locais ou redes privadas estão desabilitados neste ambiente.',
        )
      }
    }
  }

  async executeRequest(input: ExecuteHttpRequestInput): Promise<ExecuteHttpRequestOutput> {
    this.validateTargetUrl(input.url)

    const maxAttempts = Math.max(1, input.maxRetries + 1)
    const startedTimestamp = performance.now()
    let lastOutput: ExecuteHttpRequestOutput = {
      success: false,
      httpStatusCode: null,
      durationMs: 0,
      responseHeaders: {},
      responseBody: null,
      errorMessage: 'Nenhuma tentativa executada.',
      attemptCount: 0,
    }

    for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
      const attemptStart = performance.now()
      try {
        const requestHeaders: Record<string, string> = {
          'User-Agent': 'CronFlow-Worker/1.0',
          ...input.headers,
        }

        const hasBody =
          input.body !== null &&
          input.body.trim().length > 0 &&
          input.method !== 'GET' &&
          input.method !== 'DELETE'

        if (hasBody && !requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
          requestHeaders['Content-Type'] = 'application/json'
        }

        const response = await fetch(input.url, {
          method: input.method,
          headers: requestHeaders,
          body: hasBody ? input.body : undefined,
          signal: AbortSignal.timeout(input.timeoutMs),
        })

        const responseText = await response.text()
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((headerValue, headerKey) => {
          responseHeaders[headerKey] = headerValue
        })

        const isSuccess = response.status >= 200 && response.status < 300
        const totalElapsedMs = Math.max(1, Math.round(performance.now() - startedTimestamp))

        lastOutput = {
          success: isSuccess,
          httpStatusCode: response.status,
          durationMs: totalElapsedMs,
          responseHeaders,
          responseBody: responseText,
          errorMessage: isSuccess
            ? null
            : `Serviço respondeu com status HTTP ${response.status} (${response.statusText || 'Erro'}).`,
          attemptCount: attemptNumber,
        }

        if (isSuccess) {
          return lastOutput
        }
      } catch (caughtError) {
        const errorText =
          caughtError instanceof Error
            ? caughtError.name === 'TimeoutError'
              ? `Tempo limite de ${input.timeoutMs}ms excedido.`
              : caughtError.message
            : 'Falha desconhecida ao conectar ao serviço.'

        const attemptElapsedMs = Math.max(1, Math.round(performance.now() - attemptStart))
        lastOutput = {
          success: false,
          httpStatusCode: null,
          durationMs: Math.max(attemptElapsedMs, Math.round(performance.now() - startedTimestamp)),
          responseHeaders: {},
          responseBody: null,
          errorMessage: errorText,
          attemptCount: attemptNumber,
        }
      }

      if (attemptNumber < maxAttempts) {
        const backoffDelayMs = Math.min(500, attemptNumber * 120)
        await new Promise((resolve) => setTimeout(resolve, backoffDelayMs))
      }
    }

    return lastOutput
  }
}
