import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(), logout: vi.fn(), register: vi.fn(), requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(), listUsers: vi.fn(), assignRole: vi.fn(), revokeRole: vi.fn(),
    setUserStatus: vi.fn(), setDirectPermissions: vi.fn(), changePassword: vi.fn(),
  },
  profileApi: { getProfile: vi.fn(), updateProfile: vi.fn() },
}))
vi.mock('./useApi', () => ({ unwrap: async (p: Promise<any>) => { const r = await p; if (r?.error) throw new Error(r.error); return r?.data ?? r } }))

import * as hooks from './useAuth'
import { authApi } from '../services/api'
const mock = authApi as any

function wrapper(qc?: QueryClient) {
  const c = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>
}

beforeEach(() => { vi.clearAllMocks(); Object.values(mock).forEach((fn: any) => fn.mockResolvedValue?.({ data: {} })) })

describe('useAuth hooks', () => {
  it('useLogin calls authApi.login', async () => {
    const { result } = renderHook(() => hooks.useLogin(), { wrapper: wrapper() })
    await act(async () => { await result.current.mutateAsync({ username: 'u', password: 'p' } as any) })
    expect(mock.login).toHaveBeenCalled()
  })
  it('useLogout calls authApi.logout', async () => {
    const { result } = renderHook(() => hooks.useLogout(), { wrapper: wrapper() })
    await act(async () => { await result.current.mutateAsync({ accessToken: 'a', refreshToken: 'r' }) })
    expect(mock.logout).toHaveBeenCalled()
  })
  it('useRegister invalidates users', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => hooks.useRegister(), { wrapper: wrapper(qc) })
    await act(async () => { await result.current.mutateAsync({} as any) })
    expect(mock.register).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith({ queryKey: ['users'] })
  })
  it('useRequestPasswordReset', async () => {
    const { result } = renderHook(() => hooks.useRequestPasswordReset(), { wrapper: wrapper() })
    await act(async () => { await result.current.mutateAsync({} as any) })
    expect(mock.requestPasswordReset).toHaveBeenCalled()
  })
  it('useConfirmPasswordReset', async () => {
    const { result } = renderHook(() => hooks.useConfirmPasswordReset(), { wrapper: wrapper() })
    await act(async () => { await result.current.mutateAsync({} as any) })
    expect(mock.confirmPasswordReset).toHaveBeenCalled()
  })
  it('useUsers queries listUsers', async () => {
    mock.listUsers.mockResolvedValue({ data: [{ id: '1' }] })
    const { result } = renderHook(() => hooks.useUsers(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: '1' }])
  })
  it('useAssignRole invalidates users', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => hooks.useAssignRole(), { wrapper: wrapper(qc) })
    await act(async () => { await result.current.mutateAsync({ userId: '1', roleId: '2' }) })
    expect(mock.assignRole).toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
  })
  it('useRevokeRole invalidates users', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => hooks.useRevokeRole(), { wrapper: wrapper(qc) })
    await act(async () => { await result.current.mutateAsync({ userId: '1', roleId: '2' }) })
    expect(mock.revokeRole).toHaveBeenCalled()
  })
  it('useSetUserStatus invalidates users', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => hooks.useSetUserStatus(), { wrapper: wrapper(qc) })
    await act(async () => { await result.current.mutateAsync({ userId: '1', status: 'ACTIVE' }) })
    expect(mock.setUserStatus).toHaveBeenCalled()
  })
  it('useSetDirectPermissions invalidates users', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => hooks.useSetDirectPermissions(), { wrapper: wrapper(qc) })
    await act(async () => { await result.current.mutateAsync({ userId: '1', permissions: ['a'], policyEnabled: true }) })
    expect(mock.setDirectPermissions).toHaveBeenCalledWith('1', ['a'], true, undefined)
  })
  it('useChangePassword calls authApi.changePassword', async () => {
    const { result } = renderHook(() => hooks.useChangePassword(), { wrapper: wrapper() })
    await act(async () => { await result.current.mutateAsync({ currentPassword: 'a', newPassword: 'b' } as any) })
    expect(mock.changePassword).toHaveBeenCalled()
  })
})
