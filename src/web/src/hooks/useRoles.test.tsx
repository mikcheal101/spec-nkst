import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRolesList, useCreateRole, useUpdateRole, useDeleteRole } from './useRoles'

vi.mock('../services/api', () => ({
  rolesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { rolesApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('useRolesList', () => {
  it('fetches roles', async () => {
    vi.mocked(rolesApi.list).mockResolvedValueOnce({ data: [{ id: 'r1', name: 'Admin' }] })
    const { result } = renderHook(() => useRolesList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'r1', name: 'Admin' }])
  })
})

describe('useCreateRole', () => {
  it('calls rolesApi.create', async () => {
    vi.mocked(rolesApi.create).mockResolvedValueOnce({ data: { id: 'r1' } })
    const { result } = renderHook(() => useCreateRole(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ name: 'New Role' } as any) })
    expect(rolesApi.create).toHaveBeenCalledWith({ name: 'New Role' })
  })
})

describe('useUpdateRole', () => {
  it('calls rolesApi.update', async () => {
    vi.mocked(rolesApi.update).mockResolvedValueOnce({ data: { id: 'r1' } })
    const { result } = renderHook(() => useUpdateRole(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ id: 'r1', data: { name: 'Updated' } as any }) })
    expect(rolesApi.update).toHaveBeenCalledWith('r1', { name: 'Updated' })
  })
})

describe('useDeleteRole', () => {
  it('calls rolesApi.delete', async () => {
    vi.mocked(rolesApi.delete).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteRole(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync('r1') })
    expect(rolesApi.delete).toHaveBeenCalledWith('r1')
  })
})
