import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({ default: { error: (...args: any[]) => toastError(...args), success: vi.fn() } }))

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    headers: new Headers(headers),
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as any
}

describe('services/api request error handling', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    ;(globalThis as any).fetch = vi.fn()
    delete (window as any).location
    ;(window as any).location = { href: '', reload: vi.fn() }
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns standardized backend error message for 403', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(jsonResponse({ code: 'ACCESS_DENIED', message: 'You do not have permission' }, 403))
    const { authApi } = await import('./api')
    const res = await authApi.listUsers()
    expect(res.error).toBe('You do not have permission')
  })

  it('maps 429 to friendly rate-limit message when backend message missing', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(jsonResponse({ code: 'RATE_LIMITED' }, 429))
    const { authApi } = await import('./api')
    const res = await authApi.login({ username: 'u', password: 'p' })
    expect(res.error).toBe('Too many requests. Please slow down.')
  })

  it('handles 401 session expiry by clearing tokens and redirecting', async () => {
    vi.useFakeTimers()
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'rt')
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({ code: 'AUTH_TOKEN_REVOKED' }, 401)) // initial request
      .mockResolvedValueOnce(jsonResponse({}, 401)) // refresh fails

    const { authApi } = await import('./api')
    const res = await authApi.listUsers()

    expect(res.error).toBe('Session expired. Please login again.')
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(toastError).toHaveBeenCalledWith('Session expired. Please login again.')
    vi.runAllTimers()
    expect(window.location.href).toBe('/dashboard')
  })

  it('treats 401 on protected request after failed refresh as permission/session-safe error', async () => {
    localStorage.setItem('accessToken', 'at')
    localStorage.setItem('refreshToken', 'rt')
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({ code: 'AUTH_TOKEN_REVOKED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: 'new', refreshToken: 'rt2' } }, 200))
      .mockResolvedValueOnce(jsonResponse({ code: 'ACCESS_DENIED' }, 401))

    const { authApi } = await import('./api')
    const res = await authApi.listUsers()
    expect(res.error).toBe("You don't have permission to perform this action.")
  })
})
