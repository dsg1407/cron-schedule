import { type Server, createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ForbiddenTargetUrlError } from '../../../../src/domain/errors.js'
import {
  FetchHttpExecutorAdapter,
  isPrivateOrReservedIp,
} from '../../../../src/infra/http/fetch-http-executor.adapter.js'

describe('FetchHttpExecutorAdapter & SSRF Security Defense', () => {
  it('correctly classifies IPv4 and IPv6 addresses as private, reserved, or public', () => {
    // Private IPv4 ranges
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true)
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true)
    expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true)
    expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true)
    expect(isPrivateOrReservedIp('224.0.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('240.0.0.1')).toBe(true)

    // Private IPv6 ranges
    expect(isPrivateOrReservedIp('::1')).toBe(true)
    expect(isPrivateOrReservedIp('::')).toBe(true)
    expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('::ffff:7f00:1')).toBe(true)
    expect(isPrivateOrReservedIp('fc00::1')).toBe(true)
    expect(isPrivateOrReservedIp('fd12:3456::1')).toBe(true)
    expect(isPrivateOrReservedIp('fe80::1')).toBe(true)

    // Public IPs
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false)
    expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false)
    expect(isPrivateOrReservedIp('2607:f8b0:4004:805::200e')).toBe(false)
  })

  it('allows private hosts when allowPrivateNetworks is true (dev/test mode)', async () => {
    const executor = new FetchHttpExecutorAdapter(true)
    await expect(
      executor.validateTargetUrl('http://127.0.0.1:3333/api/health'),
    ).resolves.not.toThrow()
    await expect(
      executor.validateTargetUrl('http://localhost:3333/api/health'),
    ).resolves.not.toThrow()
  })

  it('rejects private IPs, localhost, and cloud metadata when allowPrivateNetworks is false', async () => {
    const executor = new FetchHttpExecutorAdapter(false)

    await expect(executor.validateTargetUrl('http://127.0.0.1:8080')).rejects.toThrow(
      ForbiddenTargetUrlError,
    )
    await expect(executor.validateTargetUrl('http://localhost:3000')).rejects.toThrow(
      ForbiddenTargetUrlError,
    )
    await expect(
      executor.validateTargetUrl('http://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow(ForbiddenTargetUrlError)
    await expect(executor.validateTargetUrl('http://10.0.0.5:9000')).rejects.toThrow(
      ForbiddenTargetUrlError,
    )
    await expect(executor.validateTargetUrl('http://192.168.1.100/admin')).rejects.toThrow(
      ForbiddenTargetUrlError,
    )
    await expect(executor.validateTargetUrl('http://[::1]:8080')).rejects.toThrow(
      ForbiddenTargetUrlError,
    )
    await expect(executor.validateTargetUrl('http://localtest.me:8080')).rejects.toThrow(
      ForbiddenTargetUrlError,
    )
  })
})

describe('FetchHttpExecutorAdapter HTTP Execution, Redirect SSRF & OOM Protection', () => {
  let testServer: Server
  let serverBaseUrl: string

  beforeAll(async () => {
    testServer = createServer((req, res) => {
      const url = req.url ?? ''

      if (url === '/ok') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'success' }))
        return
      }

      if (url === '/redirect-to-private') {
        res.writeHead(302, { Location: 'http://127.0.0.1:9999/internal' })
        res.end()
        return
      }

      if (url === '/huge-payload') {
        // Return 200 KB of text (larger than 64 KB limit)
        const largeChunk = 'A'.repeat(1024 * 200)
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end(largeChunk)
        return
      }

      res.writeHead(404)
      res.end('Not Found')
    })

    await new Promise<void>((resolve) => {
      testServer.listen(0, '127.0.0.1', () => resolve())
    })

    const address = testServer.address()
    const port = typeof address === 'object' && address ? address.port : 0
    serverBaseUrl = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      testServer.close(() => resolve())
    })
  })

  it('prevents SSRF via HTTP 302 redirects to private networks when allowPrivateNetworks is false', async () => {
    class RedirectTestExecutor extends FetchHttpExecutorAdapter {
      override async validateTargetUrl(url: string): Promise<void> {
        if (url.includes('/redirect-to-private')) {
          return
        }
        return super.validateTargetUrl(url)
      }
    }

    const executor = new RedirectTestExecutor(false)

    const result = await executor.executeRequest({
      url: `${serverBaseUrl}/redirect-to-private`,
      method: 'GET',
      headers: {},
      body: null,
      timeoutMs: 5000,
      maxRetries: 0,
    })

    expect(result.success).toBe(false)
    expect(result.errorMessage).toMatch(/Hosts locais ou redes privadas estão desabilitados/i)
  })

  it('bounds response body streaming consumption to 64 KB to prevent OOM', async () => {
    const executor = new FetchHttpExecutorAdapter(true)

    const result = await executor.executeRequest({
      url: `${serverBaseUrl}/huge-payload`,
      method: 'GET',
      headers: {},
      body: null,
      timeoutMs: 5000,
      maxRetries: 0,
    })

    expect(result.success).toBe(true)
    expect(result.responseBody).toBeDefined()
    expect(result.responseBody?.length).toBeLessThan(70000)
    expect(result.responseBody).toContain('... [truncated at 64KB]')
  })

  it('strips sensitive headers on cross-origin redirects while preserving custom headers on same-origin', async () => {
    let capturedHeaders: Record<string, string | string[] | undefined> = {}

    const secondServer = createServer((req, res) => {
      capturedHeaders = req.headers
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })

    await new Promise<void>((resolve) => {
      secondServer.listen(0, '127.0.0.1', () => resolve())
    })

    const secondAddress = secondServer.address()
    const secondPort = typeof secondAddress === 'object' && secondAddress ? secondAddress.port : 0
    const secondBaseUrl = `http://127.0.0.1:${secondPort}`

    const redirectServer = createServer((req, res) => {
      res.writeHead(302, { Location: `${secondBaseUrl}/target` })
      res.end()
    })

    await new Promise<void>((resolve) => {
      redirectServer.listen(0, '127.0.0.1', () => resolve())
    })

    const redirectAddress = redirectServer.address()
    const redirectPort =
      typeof redirectAddress === 'object' && redirectAddress ? redirectAddress.port : 0
    const redirectBaseUrl = `http://127.0.0.1:${redirectPort}`

    try {
      const executor = new FetchHttpExecutorAdapter(true)
      const result = await executor.executeRequest({
        url: `${redirectBaseUrl}/start`,
        method: 'GET',
        headers: {
          Authorization: 'Bearer secret-token',
          Cookie: 'session=secret-session',
          'Proxy-Authorization': 'Basic secret',
          'X-Safe-Header': 'safe-value',
        },
        body: null,
        timeoutMs: 5000,
        maxRetries: 0,
      })

      expect(result.success).toBe(true)
      expect(capturedHeaders.authorization).toBeUndefined()
      expect(capturedHeaders.cookie).toBeUndefined()
      expect(capturedHeaders['proxy-authorization']).toBeUndefined()
      expect(capturedHeaders['x-safe-header']).toBe('safe-value')
      expect(capturedHeaders['user-agent']).toBe('CronFlow-Worker/1.0')
    } finally {
      await new Promise<void>((resolve) => secondServer.close(() => resolve()))
      await new Promise<void>((resolve) => redirectServer.close(() => resolve()))
    }
  })

  it('prevents DNS rebinding attacks at connection time via custom undici Agent lookup', async () => {
    // Simulate a target URL where validateTargetUrl succeeds, but at socket handshake
    // the DNS resolver returns 127.0.0.1 (DNS Rebinding TOCTOU attack)
    class RebindExecutor extends FetchHttpExecutorAdapter {
      override async validateTargetUrl(): Promise<void> {
        // Simulates passing the initial pre-check
        return
      }
    }

    const rebindExecutor = new RebindExecutor(false)

    // Set up a server on 127.0.0.1
    let hitPrivateServer = false
    const privateServer = createServer((_req, res) => {
      hitPrivateServer = true
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ secret: 'exposed' }))
    })

    await new Promise<void>((resolve) => {
      privateServer.listen(0, '127.0.0.1', () => resolve())
    })

    const privateAddress = privateServer.address()
    const privatePort =
      typeof privateAddress === 'object' && privateAddress ? privateAddress.port : 0

    try {
      // Connect to localhost domain name (which undici lookup resolves to 127.0.0.1)
      const result = await rebindExecutor.executeRequest({
        url: `http://localhost:${privatePort}/secret`,
        method: 'GET',
        headers: {},
        body: null,
        timeoutMs: 3000,
        maxRetries: 0,
      })

      // Must be blocked before socket connection
      expect(result.success).toBe(false)
      expect(hitPrivateServer).toBe(false)
      expect(result.errorMessage).toMatch(/rede privada|desabilitados/i)
    } finally {
      await new Promise<void>((resolve) => privateServer.close(() => resolve()))
    }
  })
})
