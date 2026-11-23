import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({ default: { error: (...args: any[]) => toastError(...args), success: vi.fn() } }))

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    headers: new Headers(headers),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  } as any
}

describe('services/api request + wrappers', () => {
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

  it('handles 204 responses', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' })
    const { authApi } = await import('./api')
    const res = await authApi.logout({ accessToken: 'a', refreshToken: 'r' })
    expect(res).toEqual({})
  })

  it('returns network error on fetch throw', async () => {
    ;(globalThis.fetch as any).mockRejectedValueOnce(new Error('boom'))
    const { authApi } = await import('./api')
    const res = await authApi.listUsers()
    expect(res.error).toBe('Network error. Please check your connection.')
  })

  it('maps status messages and falls back to status code', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(jsonResponse({}, 404))
    const { authApi } = await import('./api')
    expect((await authApi.listUsers()).error).toBe('Service not available.')
    ;(globalThis.fetch as any).mockResolvedValueOnce(jsonResponse({}, 418))
    expect((await authApi.listUsers()).error).toBe('Request failed (418)')
  })

  it('extracts data envelope and raw body', async () => {
    ;(globalThis.fetch as any).mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }, 200))
    const { rolesApi } = await import('./api')
    expect((await rolesApi.list()).data).toEqual({ id: 1 })
    ;(globalThis.fetch as any).mockResolvedValueOnce(jsonResponse([{ id: 2 }], 200))
    expect((await rolesApi.list()).data).toEqual([{ id: 2 }])
  })

  it('refreshes token on 401 and retries successfully', async () => {
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({ message: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: 'new', refreshToken: 'rt2' } }, 200))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 'u1' }] }, 200))
    const { authApi } = await import('./api')
    const res = await authApi.listUsers()
    expect(res.data).toEqual([{ id: 'u1' }])
    expect(localStorage.getItem('accessToken')).toBe('new')
  })

  it('handles 401 refresh failure with hadToken redirect to dashboard', async () => {
    vi.useFakeTimers()
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({}, 401))
    const { authApi } = await import('./api')
    const res = await authApi.listUsers()
    expect(res.error).toBe('Session expired. Please login again.')
    expect(toastError).toHaveBeenCalled()
    vi.runAllTimers()
    expect(window.location.href).toBe('/dashboard')
  })

  it('handles 401 refresh failure without token redirects to login', async () => {
    localStorage.setItem('refreshToken', 'rt')
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({}, 401))
    const { rolesApi } = await import('./api')
    const res = await rolesApi.list()
    expect(res.error).toBe('Session expired. Please login again.')
  })

  it('queues concurrent 401 refresh callers', async () => {
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    let resolveRefresh: any
    const refreshPromise = new Promise((r) => { resolveRefresh = r })
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({}, 401)) // req1
      .mockResolvedValueOnce(jsonResponse({}, 401)) // req2
      .mockImplementationOnce(() => refreshPromise) // refresh
      .mockResolvedValueOnce(jsonResponse({ data: 'a' }, 200)) // retry1
      .mockResolvedValueOnce(jsonResponse({ data: 'b' }, 200)) // retry2
    const { authApi } = await import('./api')
    const p1 = authApi.listUsers()
    const p2 = authApi.getMyPermissions()
    resolveRefresh(jsonResponse({ data: { accessToken: 'new', refreshToken: 'rt2' } }, 200))
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1.data).toEqual('a')
    expect(r2.data).toEqual('b')
  })

  it('returns permission error when retry after refresh gets 401', async () => {
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: 'new', refreshToken: 'rt2' } }, 200))
      .mockResolvedValueOnce(jsonResponse({}, 401))
    const { authApi } = await import('./api')
    const res = await authApi.listUsers()
    expect(res.error).toBe("You don't have permission to perform this action.")
  })

  it('returns retry failure when retry after refresh is non-ok non-401', async () => {
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: 'new', refreshToken: 'rt2' } }, 200))
      .mockResolvedValueOnce(jsonResponse({}, 500))
    const { authApi } = await import('./api')
    const res = await authApi.listUsers()
    expect(res.error).toBe('Request failed after token refresh')
  })
})
