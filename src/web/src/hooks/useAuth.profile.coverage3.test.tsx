import { describe, it, expect, vi } from 'vitest'
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

it('refresh failure with Error uses error.message', async () => {
  ;(profileApi.updateProfile as any).mockResolvedValue({ data: { firstName: 'A' } })
  ;(profileApi.getProfile as any).mockRejectedValue(new Error('boom'))
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const w = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useUpdateProfile(), { wrapper: w })
  const res = await result.current.mutateAsync({ firstName: 'A', lastName: 'B', tel: '1234567' } as any)
  expect(res.refreshError).toBe('boom')
})
