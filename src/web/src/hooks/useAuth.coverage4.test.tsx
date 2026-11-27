import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSetDirectPermissions } from './useAuth'

vi.mock('../services/api', () => ({ authApi: { setDirectPermissions: vi.fn().mockResolvedValue({ data: {} }) }, profileApi: {} }))
vi.mock('./useApi', () => ({ unwrap: async (p: Promise<any>) => p }))
import { authApi } from '../services/api'

it('setDirectPermissions defaults policyEnabled false', async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const w = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useSetDirectPermissions(), { wrapper: w })
  await act(async () => { await result.current.mutateAsync({ userId: '1', permissions: ['a'] } as any) })
  expect((authApi as any).setDirectPermissions).toHaveBeenCalledWith('1', ['a'], false, undefined)
})
