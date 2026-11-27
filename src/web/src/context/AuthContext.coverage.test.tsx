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
function wrapper({ children }: { children: ReactNode }) { return <AuthProvider>{children}</AuthProvider> }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockGetMyPermissions.mockResolvedValue({ data: { permissions: [] } })
  delete (window as any).location
  ;(window as any).location = { reload: vi.fn(), href: '' }
})

describe('AuthContext coverage', () => {
  it('handles bad token and null user on refresh', async () => {
    localStorage.setItem('accessToken', 'bad.token')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    await act(async () => { await result.current.refreshPermissions() })
  })

  it('login handles missing token in response', async () => {
    mockMutateAsyncLogin.mockResolvedValue({})
    const { result } = renderHook(() => useAuth(), { wrapper })
    const err = await act(async () => result.current.login('u', 'p'))
    expect(err).toBeNull()
  })

  it('logout handles mutate failure and still clears', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u' }))
    mockMutateAsyncLogout.mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.logout() })
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('updateProfileContext noops when no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.updateProfileContext({ firstName: 'X' }))
    expect(result.current.user).toBeNull()
  })

  it('hasPermission returns false without user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.hasPermission('x')).toBe(false)
  })

  it('refreshPermissions catches errors', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u' }))
    mockGetMyPermissions.mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.refreshPermissions() })
    expect(result.current.user?.username).toBe('u')
  })
})
