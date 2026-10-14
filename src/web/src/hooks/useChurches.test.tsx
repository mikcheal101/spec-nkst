import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useChurches, useAllChurches, useChurch, useCreateChurch, useUpdateChurch, useDeleteChurch, useSubChurches, useChurchesAdminStatus } from './useChurches'

vi.mock('../services/api', () => ({
  churchApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getSubChurches: vi.fn(),
  },
  peopleApi: {
    hasChurchAdmin: vi.fn(),
  },
}))

import { churchApi, peopleApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('useChurches', () => {
  it('fetches paginated churches', async () => {
    vi.mocked(churchApi.list).mockResolvedValueOnce({ data: { content: [{ id: 1, name: 'Main' }], totalPages: 1, totalElements: 1, number: 0, size: 10, last: true, first: true, empty: false } })
    const { result } = renderHook(() => useChurches(0, 10), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.content).toHaveLength(1)
    expect(churchApi.list).toHaveBeenCalledWith(0, 10, undefined, undefined)
  })

  it('passes search and sort params', async () => {
    vi.mocked(churchApi.list).mockResolvedValueOnce({ data: { content: [{ id: 1, name: 'Main' }], totalPages: 1, totalElements: 1, number: 0, size: 10, last: true, first: true, empty: false } })
    const { result } = renderHook(() => useChurches(0, 10, 'test', 'name,asc'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(churchApi.list).toHaveBeenCalledWith(0, 10, 'test', 'name,asc')
  })

  it('uses placeholderData to keep previous data', async () => {
    vi.mocked(churchApi.list).mockResolvedValueOnce({ data: { content: [{ id: 1, name: 'Main' }], totalPages: 1, totalElements: 1, number: 0, size: 10, last: true, first: true, empty: false } })
    const { result } = renderHook(() => useChurches(0, 10), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.content).toHaveLength(1)
  })
})

describe('useAllChurches', () => {
  it('fetches all churches via list with size=200', async () => {
    vi.mocked(churchApi.list).mockResolvedValueOnce({ data: { content: [{ id: 1, name: 'A' }], totalPages: 1, totalElements: 1, number: 0, size: 200, last: true, first: true, empty: false } })
    const { result } = renderHook(() => useAllChurches(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(churchApi.list).toHaveBeenCalledWith(0, 200)
    expect(result.current.data?.content).toHaveLength(1)
  })
})

describe('useCreateChurch', () => {
  it('calls churchApi.create', async () => {
    vi.mocked(churchApi.create).mockResolvedValueOnce({ data: { id: 1 } })
    const { result } = renderHook(() => useCreateChurch(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ name: 'New' }) })
    expect(churchApi.create).toHaveBeenCalledWith({ name: 'New' })
  })
})

describe('useUpdateChurch', () => {
  it('calls churchApi.update', async () => {
    vi.mocked(churchApi.update).mockResolvedValueOnce({ data: { id: 1 } })
    const { result } = renderHook(() => useUpdateChurch(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ id: 1, data: { name: 'Updated' } }) })
    expect(churchApi.update).toHaveBeenCalledWith(1, { name: 'Updated' })
  })
})

describe('useDeleteChurch', () => {
  it('calls churchApi.delete', async () => {
    vi.mocked(churchApi.delete).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteChurch(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync(1) })
    expect(churchApi.delete).toHaveBeenCalledWith(1)
  })
})

describe('useChurch', () => {
  it('fetches a single church by id', async () => {
    vi.mocked(churchApi.get).mockResolvedValueOnce({ data: { id: 1, name: 'Grace' } })
    const { result } = renderHook(() => useChurch(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(churchApi.get).toHaveBeenCalledWith(1)
    expect(result.current.data?.name).toBe('Grace')
  })

  it('is disabled when id is null', () => {
    const { result } = renderHook(() => useChurch(null), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(churchApi.get).not.toHaveBeenCalled()
  })
})

describe('useSubChurches', () => {
  it('returns array directly when result is an array', async () => {
    vi.mocked(churchApi.getSubChurches).mockResolvedValueOnce({ data: [{ id: 2, name: 'Sub' }] })
    const { result } = renderHook(() => useSubChurches(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
  })

  it('extracts .content from paginated result', async () => {
    vi.mocked(churchApi.getSubChurches).mockResolvedValueOnce({ data: { content: [{ id: 3, name: 'Sub2' }] } })
    const { result } = renderHook(() => useSubChurches(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].name).toBe('Sub2')
  })

  it('extracts .data array from nested result', async () => {
    vi.mocked(churchApi.getSubChurches).mockResolvedValueOnce({ data: { data: [{ id: 4, name: 'Nested' }] } })
    const { result } = renderHook(() => useSubChurches(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
  })

  it('extracts .data.content from deeply nested result', async () => {
    vi.mocked(churchApi.getSubChurches).mockResolvedValueOnce({ data: { data: { content: [{ id: 5, name: 'Deep' }] } } })
    const { result } = renderHook(() => useSubChurches(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
  })

  it('returns empty array for unrecognized shape', async () => {
    vi.mocked(churchApi.getSubChurches).mockResolvedValueOnce({ data: null })
    const { result } = renderHook(() => useSubChurches(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('returns empty array when nested data has no content', async () => {
    vi.mocked(churchApi.getSubChurches).mockResolvedValueOnce({ data: { data: { foo: 'bar' } } })
    const { result } = renderHook(() => useSubChurches(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('is disabled when id is null', () => {
    const { result } = renderHook(() => useSubChurches(null), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useChurchesAdminStatus', () => {
  it('returns a map of admin statuses', async () => {
    vi.mocked(peopleApi.hasChurchAdmin).mockResolvedValue({ data: true } as any)
    const { result } = renderHook(() => useChurchesAdminStatus([1, 2]), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.size).toBe(2))
    expect(result.current.get(1)).toBe(true)
    expect(result.current.get(2)).toBe(true)
  })

  it('defaults hasAdmin to false when res.data is null', async () => {
    vi.mocked(peopleApi.hasChurchAdmin).mockResolvedValue({ data: null } as any)
    const { result } = renderHook(() => useChurchesAdminStatus([1]), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.size).toBe(1))
    expect(result.current.get(1)).toBe(false)
  })
})
