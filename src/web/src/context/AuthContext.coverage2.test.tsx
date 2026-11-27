import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
function wrapper({ children }: { children: ReactNode }) { return <AuthProvider>{children}</AuthProvider> }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockGetMyPermissions.mockResolvedValue({ data: { permissions: [] } })
  delete (window as any).location
  ;(window as any).location = { reload: vi.fn(), href: '' }
})

describe('AuthContext coverage2', () => {
  it('parses token with authorities/role fallback', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', authorities: ['A'], role: 'R' }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user?.username).toBe('u')
  })

  it('login with token field fallback', async () => {
    const token = makeToken({ sub: 'u2' })
    mockMutateAsyncLogin.mockResolvedValue({ token, refreshToken: 'r' })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.login('u2', 'p') })
    expect(localStorage.getItem('accessToken')).toBe(token)
  })

  it('login returns generic message for non-Error', async () => {
    mockMutateAsyncLogin.mockRejectedValue('bad')
    const { result } = renderHook(() => useAuth(), { wrapper })
    let err: any
    await act(async () => { err = await result.current.login('u', 'p') })
    expect(err).toBe('Login failed')
  })

  it('refreshPermissions handles raw permissions shape', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u' }))
    mockGetMyPermissions.mockResolvedValue({ data: ['profile:read'] })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.refreshPermissions() })
    expect(result.current.user).toBeTruthy()
  })
})
