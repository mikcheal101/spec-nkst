import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useUpdateProfile, useProfile } from './useAuth'

vi.mock('../services/api', () => ({
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
  authApi: {},
}))
vi.mock('./useApi', () => ({
  unwrap: async (p: Promise<any>) => {
    const r = await p
    if (r.error) throw new Error(r.error)
    return r.data
  },
}))

import { profileApi } from '../services/api'

function wrapper(client?: QueryClient) {
  const qc = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => vi.clearAllMocks())

describe('useUpdateProfile', () => {
  it('returns refreshFailed but preserves confirmed save when refresh fails', async () => {
    ;(profileApi.updateProfile as any).mockResolvedValue({ data: { firstName: 'Jane', tel: '1234567' } })
    ;(profileApi.getProfile as any).mockResolvedValue({ error: 'refresh failed' })
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapper() })
    const res = await result.current.mutateAsync({ firstName: 'Jane', lastName: 'D', tel: '1234567' } as any)
    expect(res.confirmed).toBe(true)
    expect(res.refreshFailed).toBe(true)
    expect(res.refreshError).toMatch(/refresh failed/)
    expect(res.profile.firstName).toBe('Jane')
  })

  it('syncs profile query cache after successful save', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    ;(profileApi.updateProfile as any).mockResolvedValue({ data: { firstName: 'Jane', tel: '1234567' } })
    ;(profileApi.getProfile as any).mockResolvedValue({ data: { firstName: 'Jane', tel: '1234567', email: 'a@b.com' } })
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapper(qc) })
    const res = await result.current.mutateAsync({ firstName: 'Jane', lastName: 'D', tel: '1234567' } as any)
    expect(res.refreshFailed).toBe(false)
    expect(qc.getQueryData(['profile'])).toMatchObject({ email: 'a@b.com' })
  })

  it('handles non-Error refresh failures', async () => {
    ;(profileApi.updateProfile as any).mockResolvedValue({ data: { firstName: 'Jane' } })
    ;(profileApi.getProfile as any).mockRejectedValue('bad')
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapper() })
    const res = await result.current.mutateAsync({ firstName: 'Jane', lastName: 'D', tel: '1234567' } as any)
    expect(res.refreshFailed).toBe(true)
    expect(res.refreshError).toContain('Failed to refresh')
  })
})

describe('useProfile', () => {
  it('loads profile data', async () => {
    ;(profileApi.getProfile as any).mockResolvedValue({ data: { firstName: 'A' } })
    const { result } = renderHook(() => useProfile(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.firstName).toBe('A')
  })
})
