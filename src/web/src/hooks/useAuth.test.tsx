import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useLogin, useLogout, useRegister, useRequestPasswordReset, useConfirmPasswordReset, useUsers, useAssignRole, useRevokeRole, useProfile, useUpdateProfile, useChangePassword } from './useAuth'

const mockUnwrap = vi.fn()
vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    listUsers: vi.fn(() => Promise.resolve({ data: [] })),
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
    changePassword: vi.fn(),
  },
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

import { authApi, profileApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useLogin', () => {
  it('calls authApi.login and returns data', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({ data: { token: 'abc' } })
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    let data: any
    await waitFor(async () => { data = await result.current.mutateAsync({ username: 'u', password: 'p' }) })

    expect(authApi.login).toHaveBeenCalledWith({ username: 'u', password: 'p' })
  })
})

describe('useLogout', () => {
  it('calls authApi.logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ accessToken: 'at', refreshToken: 'rt' })
    })

    expect(authApi.logout).toHaveBeenCalledWith({ accessToken: 'at', refreshToken: 'rt' })
  })
})

describe('useRegister', () => {
  it('calls authApi.register', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({ data: { id: 'u1' } })
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ username: 'u', password: 'p' } as any)
    })

    expect(authApi.register).toHaveBeenCalledWith({ username: 'u', password: 'p' })
  })
})

describe('useRequestPasswordReset', () => {
  it('calls authApi.requestPasswordReset', async () => {
    vi.mocked(authApi.requestPasswordReset).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useRequestPasswordReset(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ phoneNumber: '+234' })
    })

    expect(authApi.requestPasswordReset).toHaveBeenCalledWith({ phoneNumber: '+234' })
  })
})

describe('useConfirmPasswordReset', () => {
  it('calls authApi.confirmPasswordReset', async () => {
    vi.mocked(authApi.confirmPasswordReset).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useConfirmPasswordReset(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ phoneNumber: '+234', otp: '123', newPassword: 'new' })
    })

    expect(authApi.confirmPasswordReset).toHaveBeenCalledWith({ phoneNumber: '+234', otp: '123', newPassword: 'new' })
  })
})

describe('useUsers', () => {
  it('returns list of users', async () => {
    vi.mocked(authApi.listUsers).mockResolvedValueOnce({ data: [{ id: 'u1', username: 'admin' }] })
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'u1', username: 'admin' }])
  })
})

describe('useAssignRole', () => {
  it('calls authApi.assignRole', async () => {
    vi.mocked(authApi.assignRole).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useAssignRole(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ userId: 'u1', roleId: 'ADMIN' })
    })

    expect(authApi.assignRole).toHaveBeenCalledWith('u1', 'ADMIN')
  })
})

describe('useRevokeRole', () => {
  it('calls authApi.revokeRole', async () => {
    vi.mocked(authApi.revokeRole).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useRevokeRole(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ userId: 'u1', roleId: 'ADMIN' })
    })

    expect(authApi.revokeRole).toHaveBeenCalledWith('u1', 'ADMIN')
  })
})

describe('useProfile', () => {
  it('calls profileApi.getProfile and returns data', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValueOnce({ data: { firstName: 'John', lastName: 'Doe', phoneNumber: '+234' } })
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(profileApi.getProfile).toHaveBeenCalled()
    expect(result.current.data).toEqual({ firstName: 'John', lastName: 'Doe', phoneNumber: '+234' })
  })
})

describe('useUpdateProfile', () => {
  it('calls profileApi.updateProfile', async () => {
    vi.mocked(profileApi.updateProfile).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ firstName: 'John', lastName: 'Doe', tel: '123' })
    })

    expect(profileApi.updateProfile).toHaveBeenCalledWith({ firstName: 'John', lastName: 'Doe', tel: '123' })
  })
})

describe('useChangePassword', () => {
  it('calls authApi.changePassword', async () => {
    vi.mocked(authApi.changePassword).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() })

    await waitFor(async () => {
      await result.current.mutateAsync({ currentPassword: 'old', newPassword: 'new' })
    })

    expect(authApi.changePassword).toHaveBeenCalledWith({ currentPassword: 'old', newPassword: 'new' })
  })
})
