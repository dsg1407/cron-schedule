import { lookup as dnsLookupCallback } from 'node:dns'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { Agent, fetch as undiciFetch } from 'undici'
import type {
  ExecuteHttpRequestInput,
  ExecuteHttpRequestOutput,
  HttpExecutorPort,
} from '../../application/ports/http-executor.port.js'
import { ForbiddenTargetUrlError } from '../../domain/errors.js'

const MAX_STREAM_CAPTURE_BYTES = 65536 // 64 KB
const MAX_REDIRECTS = 5

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

export function isPrivateOrReservedIp(rawIp: string): boolean {
  let ip = rawIp.trim().replace(/^\[|\]$/g, '')

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (ip.toLowerCase().startsWith('::ffff:')) {
    const suffix = ip.slice(7)
    if (isIP(suffix) === 4) {
      ip = suffix
    } else {
      const parts = suffix.split(':')
      if (parts.length === 2) {
        const high = Number.parseInt(parts[0] ?? '0', 16)
        const low = Number.parseInt(parts[1] ?? '0', 16)
        if (!Number.isNaN(high) && !Number.isNaN(low)) {
          ip = [(high >> 8) & 0xff, high & 0xff, (low >> 8) & 0xff, low & 0xff].join('.')
        }
      }
    }
  }

  const family = isIP(ip)
  if (family === 4) {
    const octets = ip.split('.').map(Number)
    if (octets.length !== 4 || octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return true
    }
    const o0 = octets[0] ?? 0
    const o1 = octets[1] ?? 0

    if (o0 === 0) return true // 0.0.0.0/8 Current network
    if (o0 === 10) return true // 10.0.0.0/8 Private
    if (o0 === 127) return true // 127.0.0.0/8 Loopback
    if (o0 === 169 && o1 === 254) return true // 169.254.0.0/16 Link-Local / Cloud Metadata
    if (o0 === 172 && o1 >= 16 && o1 <= 31) return true // 172.16.0.0/12 Private
    if (o0 === 192 && o1 === 168) return true // 192.168.0.0/16 Private
    if (o0 === 100 && o1 >= 64 && o1 <= 127) return true // 100.64.0.0/10 Shared CGNAT
    if (o0 >= 224) return true // 224.0.0.0/4 Multicast & Reserved (240.0.0.0/4)
    return false
  }

  if (family === 6) {
    const normalized = ip.toLowerCase()
    if (normalized === '::1' || normalized === '::') return true // Loopback / Unspecified
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // Unique Local (fc00::/7)
    if (
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true // Link-Local (fe80::/10)
    }
    if (normalized.startsWith('ff')) return true // Multicast
    return false
  }

  return true
}

export class FetchHttpExecutorAdapter implements HttpExecutorPort {
  private readonly ssrfAgent: Agent | undefined

  constructor(private readonly allowPrivateNetworks: boolean = true) {
    if (!this.allowPrivateNetworks) {
      this.ssrfAgent = new Agent({
        connect: {
          lookup: (hostname, options, callback) => {
            dnsLookupCallback(hostname, { all: true }, (err, addresses) => {
              if (err) {
                return callback(err, '', 0)
              }
              const hasPrivateIp = addresses.some((record) => isPrivateOrReservedIp(record.address))
              if (hasPrivateIp) {
                const ssrfErr = new ForbiddenTargetUrlError(
                  'O domínio especificado resolve para endereços de rede privada ou reservada (bloqueado na conexão).',
                )
                return callback(ssrfErr, '', 0)
              }
              if (options?.all) {
                return callback(null, addresses)
              }
              const first = addresses[0]
              if (!first) {
                return callback(new Error(`Nenhum endereço IP retornado para ${hostname}`), '', 0)
              }
              return callback(null, first.address, first.family)
            })
          },
        },
      })
    }
  }

  async validateTargetUrl(url: string): Promise<void> {
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

      // 1. Check textual regex patterns
      const isPrivateHostPattern = PRIVATE_HOSTNAME_PATTERNS.some((pattern) =>
        pattern.test(hostname),
      )
      if (isPrivateHostPattern) {
        throw new ForbiddenTargetUrlError(
          'Hosts locais ou redes privadas estão desabilitados neste ambiente.',
        )
      }

      // 2. Check if hostname is an IP literal
      if (isPrivateOrReservedIp(hostname)) {
        throw new ForbiddenTargetUrlError(
          'Hosts locais ou redes privadas estão desabilitados neste ambiente.',
        )
      }

      // 3. Resolve DNS and verify that all resolved IPs are public
      try {
        const resolvedAddresses = await lookup(hostname, { all: true })
        for (const record of resolvedAddresses) {
          if (isPrivateOrReservedIp(record.address)) {
            throw new ForbiddenTargetUrlError(
              'O domínio especificado resolve para endereços de rede privada ou reservada, o que é proibido neste ambiente.',
            )
          }
        }
      } catch (err) {
        if (err instanceof ForbiddenTargetUrlError) {
          throw err
        }
        // If DNS lookup fails (e.g. ENOTFOUND in offline environments), let request execution report it
      }
    }
  }

  private async consumeBoundedBody(response: Response): Promise<{ body: string | null }> {
    if (!response.body) {
      return { body: null }
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let totalBytes = 0
    let isTruncated = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          totalBytes += value.length
          if (totalBytes > MAX_STREAM_CAPTURE_BYTES) {
            const allowed = MAX_STREAM_CAPTURE_BYTES - (totalBytes - value.length)
            if (allowed > 0) {
              chunks.push(value.subarray(0, allowed))
            }
            isTruncated = true
            await reader.cancel()
            break
          }
          chunks.push(value)
        }
      }
    } catch {
      // Reader canceled or stream terminated
    }

    const combined = Buffer.concat(chunks)
    let bodyText = combined.toString('utf-8')
    if (isTruncated) {
      bodyText += '\n... [truncated at 64KB]'
    }

    return { body: bodyText }
  }

  async executeRequest(input: ExecuteHttpRequestInput): Promise<ExecuteHttpRequestOutput> {
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
        await this.validateTargetUrl(input.url)
        let currentUrl = input.url
        let redirectCount = 0
        let response: Response | null = null

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

        while (redirectCount <= MAX_REDIRECTS) {
          await this.validateTargetUrl(currentUrl)

          // Follow redirects manually with re-validation of each redirect target to prevent SSRF
          const fetchMethod = redirectCount === 0 ? input.method : 'GET'
          const fetchBody = hasBody && redirectCount === 0 ? input.body : undefined

          response = (await undiciFetch(currentUrl, {
            method: fetchMethod,
            headers: requestHeaders,
            body: fetchBody,
            signal: AbortSignal.timeout(input.timeoutMs),
            redirect: 'manual',
            dispatcher: this.ssrfAgent,
          })) as unknown as Response

          const isRedirect =
            response.status >= 300 && response.status < 400 && response.headers.has('location')

          if (isRedirect && redirectCount < MAX_REDIRECTS) {
            const locationHeader = response.headers.get('location')
            if (locationHeader) {
              const nextUrl = new URL(locationHeader, currentUrl).toString()
              await this.validateTargetUrl(nextUrl)

              // SEC-07: Strip sensitive credentials/cookies when redirected across origins
              const currentOrigin = new URL(currentUrl).origin
              const nextOrigin = new URL(nextUrl).origin
              if (currentOrigin !== nextOrigin) {
                for (const headerKey of Object.keys(requestHeaders)) {
                  if (/^(authorization|cookie|proxy-authorization)$/i.test(headerKey)) {
                    delete requestHeaders[headerKey]
                  }
                }
              }

              currentUrl = nextUrl
              redirectCount += 1
              continue
            }
          }

          break
        }

        if (!response) {
          throw new Error('Falha ao obter resposta HTTP.')
        }

        const { body: responseText } = await this.consumeBoundedBody(response)

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
        const isForbidden =
          caughtError instanceof ForbiddenTargetUrlError ||
          (caughtError instanceof Error &&
            (caughtError.cause instanceof ForbiddenTargetUrlError ||
              (caughtError.cause as { name?: string })?.name === 'ForbiddenTargetUrlError'))

        const errorText = isForbidden
          ? caughtError instanceof ForbiddenTargetUrlError
            ? caughtError.message
            : (caughtError as { cause?: { message?: string } })?.cause?.message ||
              'Endereço de rede privada ou reservada proibido.'
          : caughtError instanceof Error
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

        if (isForbidden) {
          return lastOutput
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
