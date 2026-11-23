import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const mockMutateAsyncLogin = vi.fn()
const mockMutateAsyncLogout = vi.fn()
const mockGetMyPermissions = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useLogin: () => ({ mutateAsync: mockMutateAsyncLogin }),
  useLogout: () => ({ mutateAsync: mockMutateAsyncLogout }),
}))
vi.mock('../../services/api', () => ({
  authApi: { getMyPermissions: (...args: any[]) => mockGetMyPermissions(...args) },
}))

import { AuthProvider, useAuth } from '../../context/AuthContext'

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.sig`
}
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  delete (window as any).location
  ;(window as any).location = { href: '', reload: vi.fn() }
  mockGetMyPermissions.mockResolvedValue({ data: { permissions: [] } })
})

describe('Auth lifecycle behaviors', () => {
  it('sign-in stores session tokens through login mutation flow', async () => {
    mockMutateAsyncLogin.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.login('superadmin', 'pw') })
    expect(mockMutateAsyncLogin).toHaveBeenCalledWith({ username: 'superadmin', password: 'pw' })
  })

  it('refresh/permission fetch normalizes canonical and legacy permissions', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', permissions: [] }))
    mockGetMyPermissions.mockResolvedValueOnce({ data: ['CAN_READ_MEMBERS', 'ROLES:UPDATE'] })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user?.permissions).toEqual(['MEMBERS:READ', 'ROLES:UPDATE']))
  })

  it('logout calls backend and clears local session', async () => {
    localStorage.setItem('accessToken', 'at')
    localStorage.setItem('refreshToken', 'rt')
    mockMutateAsyncLogout.mockResolvedValue({})
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.logout() })
    expect(mockMutateAsyncLogout).toHaveBeenCalled()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('profile/session cutoff unauthorized event clears tokens', async () => {
    localStorage.setItem('accessToken', 'at')
    localStorage.setItem('refreshToken', 'rt')
    renderHook(() => useAuth(), { wrapper })
    act(() => window.dispatchEvent(new Event('auth:unauthorized')))
    await waitFor(() => expect(localStorage.getItem('accessToken')).toBeNull())
    expect(window.location.href).toBe('/login')
  })
})
