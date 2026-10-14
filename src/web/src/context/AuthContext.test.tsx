import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

const mockMutateAsyncLogin = vi.fn()
const mockMutateAsyncLogout = vi.fn()

vi.mock('../hooks/useAuth', () => ({
  useLogin: () => ({ mutateAsync: mockMutateAsyncLogin }),
  useLogout: () => ({ mutateAsync: mockMutateAsyncLogout }),
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
  localStorage.clear()
  delete (window as any).location
  ;(window as any).location = { reload: vi.fn(), href: '' }
})

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider',
    )
  })
})

describe('AuthProvider user', () => {
  it('provides user parsed from JWT in localStorage', () => {
    const token = makeToken({ sub: 'testuser', churchId: '1', permissions: ['read'], roles: ['ADMIN'] })
    localStorage.setItem('accessToken', token)

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toEqual({
      username: 'testuser',
      churchId: '1',
      phoneNumber: undefined,
      permissions: ['read'],
      roles: ['ADMIN'],
    })
  })

  it('provides null user when no token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it('handles invalid JWT token gracefully', () => {
    localStorage.setItem('accessToken', 'not-a-valid-token')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })
})

describe('parseToken variations', () => {
  it('handles sub field', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'alice', permissions: [], roles: [] }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.username).toBe('alice')
  })

  it('handles username field fallback', () => {
    localStorage.setItem('accessToken', makeToken({ username: 'bob', permissions: [], roles: [] }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.username).toBe('bob')
  })

  it('handles authorities fallback for permissions', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', authorities: ['write'], roles: [] }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.permissions).toEqual(['write'])
  })

  it('handles singular role fallback', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', permissions: [], role: 'EDITOR' }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.roles).toEqual(['EDITOR'])
  })

  it('defaults username to empty when neither sub nor username', () => {
    localStorage.setItem('accessToken', makeToken({ permissions: ['p'], roles: ['r'] }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.username).toBe('')
  })

  it('defaults permissions to empty when neither permissions nor authorities', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', roles: ['r'] }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.permissions).toEqual([])
  })

  it('defaults roles to empty when neither roles nor role', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', permissions: ['p'] }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.roles).toEqual([])
  })

  it('parses phoneNumber from token', () => {
    localStorage.setItem('accessToken', makeToken({ sub: 'u', phoneNumber: '080123', permissions: [], roles: [] }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user!.phoneNumber).toBe('080123')
  })
})

describe('login', () => {
  it('calls mutateAsync, persists tokens, and reloads on success', async () => {
    const accessToken = makeToken({ sub: 'u', permissions: [], roles: [] })
    mockMutateAsyncLogin.mockResolvedValueOnce({ accessToken, refreshToken: 'rt1' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    let error: string | null = null
    await act(async () => {
      error = await result.current.login('user', 'pass')
    })

    expect(mockMutateAsyncLogin).toHaveBeenCalledWith({ username: 'user', password: 'pass' })
    expect(localStorage.getItem('accessToken')).toBe(accessToken)
    expect(localStorage.getItem('refreshToken')).toBe('rt1')
    expect(error).toBeNull()
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('returns error message on failure', async () => {
    mockMutateAsyncLogin.mockRejectedValueOnce(new Error('Invalid credentials'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    let error: string | null = null
    await act(async () => {
      error = await result.current.login('user', 'wrong')
    })

    expect(error).toBe('Invalid credentials')
  })

  it('returns generic message for non-Error rejection', async () => {
    mockMutateAsyncLogin.mockRejectedValueOnce('unknown')

    const { result } = renderHook(() => useAuth(), { wrapper })

    let error: string | null = null
    await act(async () => {
      error = await result.current.login('user', 'wrong')
    })

    expect(error).toBe('Login failed')
  })
})

describe('logout', () => {
  it('calls mutateAsync, clears tokens, redirects to /login', async () => {
    localStorage.setItem('accessToken', 'at')
    localStorage.setItem('refreshToken', 'rt')
    mockMutateAsyncLogout.mockResolvedValueOnce({})

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockMutateAsyncLogout).toHaveBeenCalledWith({ accessToken: 'at', refreshToken: 'rt' })
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('clears tokens even when mutateAsync throws', async () => {
    localStorage.setItem('accessToken', 'at')
    localStorage.setItem('refreshToken', 'rt')
    mockMutateAsyncLogout.mockRejectedValueOnce(new Error('fail'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })
})

describe('persistTokens', () => {
  it('handles token field fallback', async () => {
    mockMutateAsyncLogin.mockResolvedValueOnce({ token: 'tok1', refreshToken: 'rt1' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('u', 'p')
    })

    expect(localStorage.getItem('accessToken')).toBe('tok1')
  })

  it('skips empty accessToken', async () => {
    mockMutateAsyncLogin.mockResolvedValueOnce({ accessToken: '', refreshToken: 'rt1' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('u', 'p')
    })

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBe('rt1')
  })

  it('skips persist when login returns undefined', async () => {
    mockMutateAsyncLogin.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('u', 'p')
    })

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('does not reload when parsed token is null after login', async () => {
    mockMutateAsyncLogin.mockResolvedValueOnce({ accessToken: 'invalid-junk', refreshToken: '' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('u', 'p')
    })

    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('handles login with only refreshToken', async () => {
    mockMutateAsyncLogin.mockResolvedValueOnce({ refreshToken: 'rt1' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('u', 'p')
    })

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBe('rt1')
  })

  it('skips empty refreshToken', async () => {
    mockMutateAsyncLogin.mockResolvedValueOnce({ accessToken: 'at', refreshToken: '' })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('u', 'p')
    })

    expect(localStorage.getItem('refreshToken')).toBeNull()
  })
})

describe('logout edge cases', () => {
  it('uses empty strings when localStorage is empty', async () => {
    mockMutateAsyncLogout.mockResolvedValueOnce({})

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockMutateAsyncLogout).toHaveBeenCalledWith({ accessToken: '', refreshToken: '' })
    expect(window.location.href).toBe('/login')
  })
})

describe('loading property', () => {
  it('always returns false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.loading).toBe(false)
  })
})
