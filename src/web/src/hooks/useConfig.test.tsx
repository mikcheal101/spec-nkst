import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useConfig, useUpdateConfig } from './useConfig'

vi.mock('../services/api', () => ({
  configApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

import { configApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('useConfig', () => {
  it('fetches config', async () => {
    vi.mocked(configApi.get).mockResolvedValueOnce({ data: { churchName: 'Test Church', churchAddress: '', defaultCurrency: 'NGN' } })
    const { result } = renderHook(() => useConfig(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual({ churchName: 'Test Church', churchAddress: '', defaultCurrency: 'NGN' })
  })
})

describe('useUpdateConfig', () => {
  it('calls configApi.update', async () => {
    vi.mocked(configApi.update).mockResolvedValueOnce({ data: { churchName: 'Updated', churchAddress: '', defaultCurrency: 'USD' } })
    const { result } = renderHook(() => useUpdateConfig(), { wrapper: createWrapper() })
    await waitFor(async () => {
      await result.current.mutateAsync({ churchName: 'Updated', churchAddress: '', defaultCurrency: 'USD' })
    })
    expect(configApi.update).toHaveBeenCalledWith({ churchName: 'Updated', churchAddress: '', defaultCurrency: 'USD' })
  })
})
