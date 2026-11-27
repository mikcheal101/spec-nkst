import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useUpdateProfile } from './useAuth'

vi.mock('../services/api', () => ({
  profileApi: { getProfile: vi.fn(), updateProfile: vi.fn() },
  authApi: {},
}))
vi.mock('./useApi', () => ({ unwrap: async (p: Promise<any>) => { const r = await p; if (r.error) throw new Error(r.error); return r.data } }))
import { profileApi } from '../services/api'

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => vi.clearAllMocks())

it('useUpdateProfile returns default refresh error message for non-Error throw', async () => {
  ;(profileApi.updateProfile as any).mockResolvedValue({ data: { firstName: 'A' } })
  ;(profileApi.getProfile as any).mockImplementation(() => { throw 'x' })
  const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapper() })
  const res = await result.current.mutateAsync({ firstName: 'A', lastName: 'B', tel: '1234567' } as any)
  expect(res.refreshFailed).toBe(true)
  expect(res.refreshError).toBe('Failed to refresh profile after save')
})
