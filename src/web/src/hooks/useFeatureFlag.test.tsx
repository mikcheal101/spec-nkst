import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFeatureFlag } from './useFeatureFlag'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useFeatureFlag hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns loading state initially', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { result } = renderHook(() => useFeatureFlag('church.features.memberSelfService'), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.state).toBeNull()
  })

  it('can be called with a key and resolves the flag state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isEnabled: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useFeatureFlag('church.features.memberSelfService'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.state).toBe(true))

    expect(fetchMock).toHaveBeenCalledWith('/api/feature-flags?key=church.features.memberSelfService')
  })
})
