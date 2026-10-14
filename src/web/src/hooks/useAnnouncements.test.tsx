import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAnnouncementsList, useEventsList, useCreateAnnouncement, useUpdateAnnouncement, useCreateEvent } from './useAnnouncements'

vi.mock('../services/api', () => ({
  announcementApi: {
    list: vi.fn(),
    listEvents: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    createEvent: vi.fn(),
  },
}))

import { announcementApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('useAnnouncementsList', () => {
  it('fetches announcements', async () => {
    vi.mocked(announcementApi.list).mockResolvedValueOnce({ data: [{ id: 'a1', title: 'News' }] })
    const { result } = renderHook(() => useAnnouncementsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'a1', title: 'News' }])
  })
})

describe('useEventsList', () => {
  it('fetches events', async () => {
    vi.mocked(announcementApi.listEvents).mockResolvedValueOnce({ data: [{ id: 'e1', title: 'Event' }] })
    const { result } = renderHook(() => useEventsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'e1', title: 'Event' }])
  })
})

describe('useCreateAnnouncement', () => {
  it('calls announcementApi.create', async () => {
    vi.mocked(announcementApi.create).mockResolvedValueOnce({ data: { id: 'a1' } })
    const { result } = renderHook(() => useCreateAnnouncement(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ title: 'New', content: 'Content' }) })
    expect(announcementApi.create).toHaveBeenCalledWith({ title: 'New', content: 'Content' })
  })
})

describe('useUpdateAnnouncement', () => {
  it('calls announcementApi.update', async () => {
    vi.mocked(announcementApi.update).mockResolvedValueOnce({ data: { id: 'a1' } })
    const { result } = renderHook(() => useUpdateAnnouncement(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ id: 'a1', data: { title: 'Updated' } }) })
    expect(announcementApi.update).toHaveBeenCalledWith('a1', { title: 'Updated' })
  })
})

describe('useCreateEvent', () => {
  it('calls announcementApi.createEvent', async () => {
    vi.mocked(announcementApi.createEvent).mockResolvedValueOnce({ data: { id: 'e1' } })
    const { result } = renderHook(() => useCreateEvent(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ title: 'New Event', eventStartDate: '2025-01-01' }) })
    expect(announcementApi.createEvent).toHaveBeenCalledWith({ title: 'New Event', eventStartDate: '2025-01-01' })
  })
})
