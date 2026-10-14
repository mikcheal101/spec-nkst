import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useContributionsList, useRecordContribution } from './useContributions'

vi.mock('../services/api', () => ({
  contributionApi: {
    listContributions: vi.fn(),
    recordContribution: vi.fn(),
  },
}))

import { contributionApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('useContributionsList', () => {
  it('fetches contributions', async () => {
    vi.mocked(contributionApi.listContributions).mockResolvedValueOnce({ data: [{ id: 'c1', amount: 100 }] })
    const { result } = renderHook(() => useContributionsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'c1', amount: 100 }])
  })
})

describe('useRecordContribution', () => {
  it('calls contributionApi.recordContribution', async () => {
    vi.mocked(contributionApi.recordContribution).mockResolvedValueOnce({ data: { id: 'c1' } })
    const { result } = renderHook(() => useRecordContribution(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ amount: 100 }) })
    expect(contributionApi.recordContribution).toHaveBeenCalledWith({ amount: 100 })
  })
})
