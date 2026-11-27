import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const mockMutateAsyncLogin = vi.fn()
const mockMutateAsyncLogout = vi.fn()
const mockGetMyPermissions = vi.fn()

vi.mock('../hooks/useAuth', () => ({
  useLogin: () => ({ mutateAsync: mockMutateAsyncLogin }),
  useLogout: () => ({ mutateAsync: mockMutateAsyncLogout }),
}))
vi.mock('../services/api', () => ({
  authApi: { getMyPermissions: (...args: any[]) => mockGetMyPermissions(...args) },
}))

import { AuthProvider, useAuth } from './AuthContext'

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.sig`
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMyPermissions.mockResolvedValue({ data: { permissions: [] } })
  localStorage.clear()
  delete (window as any).location
  ;(window as any).location = { reload: vi.fn(), href: '' }
})

describe('AuthContext profile sync', () => {
  it('updates session/profile context fields', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', phoneNumber: '111' }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.updateProfileContext({ firstName: 'Jane', email: 'j@b.com' }))
    expect(result.current.user?.firstName).toBe('Jane')
    expect(result.current.user?.email).toBe('j@b.com')
  })

  it('login persists tokens and sets user', async () => {
    const token = makeToken({ sub: 'u1', phoneNumber: '123' })
    mockMutateAsyncLogin.mockResolvedValue({ accessToken: token, refreshToken: 'rt' })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.login('u1', 'pw') })
    expect(localStorage.getItem('accessToken')).toBe(token)
    expect(result.current.user?.username).toBe('u1')
  })

  it('login returns error message on failure', async () => {
    mockMutateAsyncLogin.mockRejectedValue(new Error('bad creds'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    let err: string | null = null
    await act(async () => { err = await result.current.login('u1', 'bad') })
    expect(err).toBe('bad creds')
  })

  it('logout clears tokens and redirects', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u' }))
    localStorage.setItem('refreshToken', 'rt')
    mockMutateAsyncLogout.mockResolvedValue({})
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.logout() })
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect((window as any).location.href).toBe('/login')
  })

  it('handles unauthorized event', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u' }))
    renderHook(() => useAuth(), { wrapper })
    window.dispatchEvent(new Event('auth:unauthorized'))
    await waitFor(() => expect(localStorage.getItem('accessToken')).toBeNull())
  })

  it('refreshPermissions merges permissions', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u' }))
    mockGetMyPermissions.mockResolvedValue({ data: { permissions: ['profile:read'] } })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.refreshPermissions() })
    expect(result.current.hasPermission('profile:read')).toBe(true)
  })
})
