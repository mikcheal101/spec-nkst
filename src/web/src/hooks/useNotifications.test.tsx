import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useNotificationTemplates } from './useNotifications'

vi.mock('../services/api', () => ({
  notificationApi: {
    listTemplates: vi.fn(),
  },
}))

import { notificationApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('useNotificationTemplates', () => {
  it('fetches notification templates', async () => {
    vi.mocked(notificationApi.listTemplates).mockResolvedValueOnce({ data: [{ id: 'n1', title: 'Welcome' }] })
    const { result } = renderHook(() => useNotificationTemplates(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'n1', title: 'Welcome' }])
  })
})
