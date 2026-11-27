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
  vi.clearAllMocks(); localStorage.clear();
  mockGetMyPermissions.mockResolvedValue({ data: { permissions: [] } })
  delete (window as any).location; (window as any).location = { reload: vi.fn(), href: '' }
})

describe('AuthContext branch coverage3', () => {
  it('parses token with username field and no sub', () => {
    localStorage.setItem('accessToken', makeToken({ username: 'u3' }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user?.username).toBe('u3')
  })
  it('handles permission response without data', async () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u' }))
    mockGetMyPermissions.mockResolvedValue({})
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.refreshPermissions() })
    expect(result.current.user?.username).toBe('u')
  })
  it('login handles parsed null token', async () => {
    mockMutateAsyncLogin.mockResolvedValue({ accessToken: 'not.a.jwt' })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.login('u','p') })
    // no crash
    expect(result.current.user).toBeNull()
  })
})
