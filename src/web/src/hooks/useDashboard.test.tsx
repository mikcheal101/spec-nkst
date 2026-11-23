import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDashboardCounters } from './useDashboard'

vi.mock('../services/api', () => ({
  dashboardApi: {
    getCounters: vi.fn(),
  },
}))

import { dashboardApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('useDashboardCounters', () => {
  it('returns counters', async () => {
    const counters = { dailyMessage: null, members: 10, contributions: 20, churches: 0, projects: 0, announcements: 0 }
    vi.mocked(dashboardApi.getCounters).mockResolvedValueOnce({ data: counters })
    const { result } = renderHook(() => useDashboardCounters(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(counters)
  })
})
