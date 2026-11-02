import { env } from '@/env'

const AUTH_TOKEN_STORAGE_KEY = 'cronflow:auth-token'

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }
}

export class ApiHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiHttpError'
  }
}

export interface ApiRequestOptions {
  params?: Record<string, string | number | null | undefined>
  body?: unknown
  headers?: Record<string, string>
}

function buildRequestUrl(
  path: string,
  params?: Record<string, string | number | null | undefined>,
): string {
  const normalizedBase = env.VITE_API_URL.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${normalizedBase}${normalizedPath}`)

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      if (paramValue !== undefined && paramValue !== null && String(paramValue).length > 0) {
        url.searchParams.set(paramKey, String(paramValue))
      }
    }
  }

  return url.toString()
}

async function performRequest<ResponseType>(
  method: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: ResponseType }> {
  const token = getStoredAuthToken()
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(buildRequestUrl(path, options.params), {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) {
    return { data: null as ResponseType }
  }

  const responseData = (await response.json().catch(() => null)) as
    | (ResponseType & { message?: string })
    | null

  if (!response.ok) {
    const errorMessage =
      responseData && typeof responseData === 'object' && 'message' in responseData
        ? String(responseData.message)
        : `Falha na requisição (HTTP ${response.status})`

    throw new ApiHttpError(response.status, errorMessage)
  }

  return { data: responseData as ResponseType }
}

export const api = {
  get<ResponseType>(path: string, options?: ApiRequestOptions) {
    return performRequest<ResponseType>('GET', path, options)
  },
  post<ResponseType>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return performRequest<ResponseType>('POST', path, { ...options, body })
  },
  put<ResponseType>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return performRequest<ResponseType>('PUT', path, { ...options, body })
  },
  patch<ResponseType>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return performRequest<ResponseType>('PATCH', path, { ...options, body })
  },
  delete<ResponseType>(path: string, options?: ApiRequestOptions) {
    return performRequest<ResponseType>('DELETE', path, options)
  },
}
