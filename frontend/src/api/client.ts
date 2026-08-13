import type { ErrorCode, ProblemDetail } from '../types/api'

const rawOrigin = import.meta.env.VITE_API_BASE_URL as string | undefined
const normalizedOrigin = (rawOrigin ?? '').replace(/\/+$/, '')

export const API_BASE: string = normalizedOrigin ? `${normalizedOrigin}/api` : '/api'

export class ApiError extends Error {
  readonly status: number
  readonly code?: ErrorCode
  readonly detail?: string
  readonly fieldErrors?: Record<string, string>
  readonly isNetworkError: boolean

  constructor(problem: ProblemDetail, isNetworkError = false) {
    super(problem.detail ?? problem.title ?? `Request failed with status ${problem.status}`)
    this.name = 'ApiError'
    this.status = problem.status
    this.code = problem.code
    this.detail = problem.detail
    this.fieldErrors = problem.errors
    this.isNetworkError = isNetworkError
  }
}

export interface RequestOptions {
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      { status: 0, title: 'Network error', detail: 'Could not reach the server.' },
      true,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (response.ok) {
      return undefined as T
    }
    throw new ApiError({ status: response.status, title: response.statusText })
  }

  const payload = (await response.json()) as T | ProblemDetail
  if (!response.ok) {
    throw new ApiError(payload as ProblemDetail)
  }
  return payload as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}
