import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { usePendingTasks, useTakeAction } from './useWorkflows'

vi.mock('../services/api', () => ({
  workflowApi: {
    getPendingTasks: vi.fn(),
    takeAction: vi.fn(),
  },
}))

import { workflowApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('usePendingTasks', () => {
  it('fetches pending tasks', async () => {
    vi.mocked(workflowApi.getPendingTasks).mockResolvedValueOnce({ data: [{ stepId: 's1', workflowId: 'w1' }] })
    const { result } = renderHook(() => usePendingTasks(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ stepId: 's1', workflowId: 'w1' }])
  })
})

describe('useTakeAction', () => {
  it('calls workflowApi.takeAction', async () => {
    vi.mocked(workflowApi.takeAction).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useTakeAction(), { wrapper: createWrapper() })
    await waitFor(async () => {
      await result.current.mutateAsync({ stepId: 's1', data: { action: 'APPROVE' } })
    })
    expect(workflowApi.takeAction).toHaveBeenCalledWith('s1', { action: 'APPROVE' })
  })
})
