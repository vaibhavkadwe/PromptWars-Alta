/**
 * API client for SafeSignal backend.
 */

import { AnalyzeRequest, AnalyzeResponse, ApiError, HealthResponse, Resource } from '../types/report'

export class SafeSignalApiError extends Error {
  code: string
  retryAfter?: number
  requestId?: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'SafeSignalApiError'
    this.code = error.code
    this.retryAfter = error.retryAfter
    this.requestId = error.request_id
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errBody: { error?: ApiError } = {}
    try {
      errBody = await res.json()
    } catch {
      // Body not JSON
    }

    const retryAfterHeader = res.headers.get('Retry-After')
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined

    const errorDetail: ApiError = errBody.error || {
      code: res.status === 429 ? 'RATE_LIMIT_EXCEEDED' : `HTTP_${res.status}`,
      message:
        res.status === 429
          ? `Too many requests. Please wait ${retryAfter || 30} seconds.`
          : res.status === 413
          ? 'Input exceeds size limit (64 KB).'
          : res.status === 503
          ? 'AI service is temporarily unavailable.'
          : res.status === 502
          ? 'AI generated an invalid report. Please try again.'
          : 'An unexpected server error occurred.',
      retryAfter,
    }

    if (retryAfter && !errorDetail.retryAfter) {
      errorDetail.retryAfter = retryAfter
    }

    throw new SafeSignalApiError(errorDetail)
  }

  return (await res.json()) as T
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health')
  return handleResponse<HealthResponse>(res)
}

export async function fetchResources(): Promise<Resource[]> {
  const res = await fetch('/api/resources')
  return handleResponse<Resource[]>(res)
}

export async function fetchSampleReport(): Promise<AnalyzeResponse> {
  const res = await fetch('/api/sample')
  return handleResponse<AnalyzeResponse>(res)
}

export async function analyzeIncident(
  payload: AnalyzeRequest,
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })
  return handleResponse<AnalyzeResponse>(res)
}
