import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  usePeopleList, useCreatePerson, useUpdatePerson, useDeletePerson,
  usePastorsList, usePastor, useCreatePastor, useUpdatePastor, useDeletePastor,
  useEldersList, useElder, useCreateElder, useUpdateElder, useDeleteElder,
  useDeaconsList, useDeacon, useCreateDeacon, useUpdateDeacon, useDeleteDeacon,
  useMakeChurchAdmin, usePastorRoles, useChurchMembers, usePerson,
} from './usePeople'

vi.mock('../services/api', () => ({
  peopleApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    makeChurchAdmin: vi.fn(),
  },
  pastorsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  eldersApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  deaconsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  pastorRolesApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}))

import { peopleApi, pastorsApi, eldersApi, deaconsApi } from '../services/api'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('usePeopleList', () => {
  it('fetches people', async () => {
    vi.mocked(peopleApi.list).mockResolvedValueOnce({ data: [{ id: 'p1', firstName: 'John' }] })
    const { result } = renderHook(() => usePeopleList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'p1', firstName: 'John' }])
  })
})

describe('useCreatePerson', () => {
  it('calls peopleApi.create', async () => {
    vi.mocked(peopleApi.create).mockResolvedValueOnce({ data: { id: 'p1' } })
    const { result } = renderHook(() => useCreatePerson(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ firstName: 'John' }) })
    expect(peopleApi.create).toHaveBeenCalledWith({ firstName: 'John' })
  })
})

describe('useUpdatePerson', () => {
  it('calls peopleApi.update', async () => {
    vi.mocked(peopleApi.update).mockResolvedValueOnce({ data: { id: 'p1' } })
    const { result } = renderHook(() => useUpdatePerson(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ id: 'p1', data: { firstName: 'Jane' } }) })
    expect(peopleApi.update).toHaveBeenCalledWith('p1', { firstName: 'Jane' })
  })
})

describe('useDeletePerson', () => {
  it('calls peopleApi.delete', async () => {
    vi.mocked(peopleApi.delete).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeletePerson(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync('p1') })
    expect(peopleApi.delete).toHaveBeenCalledWith('p1')
  })
})

describe('usePastorsList', () => {
  it('fetches pastors', async () => {
    vi.mocked(pastorsApi.list).mockResolvedValueOnce({ data: [{ id: 1, firstName: 'John', lastName: 'Doe', gender: 'Male', isBaptised: false }] })
    const { result } = renderHook(() => usePastorsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].firstName).toBe('John')
  })
})

describe('usePastor', () => {
  it('fetches a single pastor by id', async () => {
    vi.mocked(pastorsApi.get).mockResolvedValueOnce({ data: { id: 1, firstName: 'John', lastName: 'Doe', gender: 'Male', isBaptised: false } })
    const { result } = renderHook(() => usePastor('1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.firstName).toBe('John')
  })

  it('does not fetch when id is undefined', async () => {
    const { result } = renderHook(() => usePastor(undefined), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(pastorsApi.get).not.toHaveBeenCalled()
  })
})

describe('useCreatePastor', () => {
  it('calls pastorsApi.create', async () => {
    vi.mocked(pastorsApi.create).mockResolvedValueOnce({ data: { id: 1, firstName: 'John', lastName: 'Doe', gender: 'Male', isBaptised: false } })
    const { result } = renderHook(() => useCreatePastor(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ memberId: 1, pastorRoleId: 2, churchId: 3 }) })
    expect(pastorsApi.create).toHaveBeenCalledWith({ memberId: 1, pastorRoleId: 2, churchId: 3 })
  })
})

describe('useUpdatePastor', () => {
  it('calls pastorsApi.update', async () => {
    vi.mocked(pastorsApi.update).mockResolvedValueOnce({ data: { id: 1, firstName: 'John', lastName: 'Doe', gender: 'Male', isBaptised: false } })
    const { result } = renderHook(() => useUpdatePastor(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ id: '1', data: { memberId: 1, pastorRoleId: 5, churchId: 3 } }) })
    expect(pastorsApi.update).toHaveBeenCalledWith('1', { memberId: 1, pastorRoleId: 5, churchId: 3 })
  })
})

describe('useDeletePastor', () => {
  it('calls pastorsApi.delete', async () => {
    vi.mocked(pastorsApi.delete).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeletePastor(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync('1') })
    expect(pastorsApi.delete).toHaveBeenCalledWith('1')
  })
})

describe('useEldersList', () => {
  it('fetches elders', async () => {
    vi.mocked(eldersApi.list).mockResolvedValueOnce({ data: [{ id: 2, firstName: 'Jane', lastName: 'Smith', gender: 'Female', isBaptised: false }] })
    const { result } = renderHook(() => useEldersList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].firstName).toBe('Jane')
  })
})

describe('useElder', () => {
  it('fetches a single elder by id', async () => {
    vi.mocked(eldersApi.get).mockResolvedValueOnce({ data: { id: 2, firstName: 'Jane', lastName: 'Smith', gender: 'Female', isBaptised: false } })
    const { result } = renderHook(() => useElder('2'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.firstName).toBe('Jane')
  })

  it('does not fetch when id is undefined', async () => {
    const { result } = renderHook(() => useElder(undefined), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(eldersApi.get).not.toHaveBeenCalled()
  })
})

describe('useCreateElder', () => {
  it('calls eldersApi.create', async () => {
    vi.mocked(eldersApi.create).mockResolvedValueOnce({ data: { id: 2, firstName: 'Jane', lastName: 'Smith', gender: 'Female', isBaptised: false } })
    const { result } = renderHook(() => useCreateElder(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ memberId: 2 }) })
    expect(eldersApi.create).toHaveBeenCalledWith({ memberId: 2 })
  })
})

describe('useUpdateElder', () => {
  it('calls eldersApi.update', async () => {
    vi.mocked(eldersApi.update).mockResolvedValueOnce({ data: { id: 2, firstName: 'Jane', gender: 'Female', isBaptised: false } })
    const { result } = renderHook(() => useUpdateElder(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ id: '2', data: { firstName: 'Jane' } }) })
    expect(eldersApi.update).toHaveBeenCalledWith('2', { firstName: 'Jane' })
  })
})

describe('useDeleteElder', () => {
  it('calls eldersApi.delete', async () => {
    vi.mocked(eldersApi.delete).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteElder(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync('2') })
    expect(eldersApi.delete).toHaveBeenCalledWith('2')
  })
})

describe('useDeaconsList', () => {
  it('fetches deacons', async () => {
    vi.mocked(deaconsApi.list).mockResolvedValueOnce({ data: [{ id: 3, firstName: 'Paul', lastName: 'Baker', gender: 'Male', isBaptised: false }] })
    const { result } = renderHook(() => useDeaconsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].firstName).toBe('Paul')
  })
})

describe('useDeacon', () => {
  it('fetches a single deacon by id', async () => {
    vi.mocked(deaconsApi.get).mockResolvedValueOnce({ data: { id: 3, firstName: 'Paul', lastName: 'Baker', gender: 'Male', isBaptised: false } })
    const { result } = renderHook(() => useDeacon('3'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.firstName).toBe('Paul')
  })

  it('does not fetch when id is undefined', async () => {
    const { result } = renderHook(() => useDeacon(undefined), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(deaconsApi.get).not.toHaveBeenCalled()
  })
})

describe('useCreateDeacon', () => {
  it('calls deaconsApi.create with memberId', async () => {
    vi.mocked(deaconsApi.create).mockResolvedValueOnce({ data: { id: 3, firstName: 'Paul', lastName: 'Baker', gender: 'Male', isBaptised: false } })
    const { result } = renderHook(() => useCreateDeacon(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ memberId: 2 }) })
    expect(deaconsApi.create).toHaveBeenCalledWith({ memberId: 2 })
  })
})

describe('useUpdateDeacon', () => {
  it('calls deaconsApi.update', async () => {
    vi.mocked(deaconsApi.update).mockResolvedValueOnce({ data: { id: 3, firstName: 'Paul', lastName: 'Baker', gender: 'Male', isBaptised: false } })
    const { result } = renderHook(() => useUpdateDeacon(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync({ id: '3', data: { firstName: 'Paul' } }) })
    expect(deaconsApi.update).toHaveBeenCalledWith('3', { firstName: 'Paul' })
  })
})

describe('useDeleteDeacon', () => {
  it('calls deaconsApi.delete', async () => {
    vi.mocked(deaconsApi.delete).mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteDeacon(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync('3') })
    expect(deaconsApi.delete).toHaveBeenCalledWith('3')
  })
})

describe('useMakeChurchAdmin', () => {
  it('calls peopleApi.makeChurchAdmin', async () => {
    vi.mocked(peopleApi.makeChurchAdmin).mockResolvedValueOnce({ data: true })
    const { result } = renderHook(() => useMakeChurchAdmin(), { wrapper: createWrapper() })
    await waitFor(async () => { await result.current.mutateAsync('p1') })
    expect(peopleApi.makeChurchAdmin).toHaveBeenCalledWith('p1')
  })
})

describe('usePastorRoles', () => {
  it('fetches pastor roles', async () => {
    const { pastorRolesApi } = await import('../services/api')
    vi.mocked(pastorRolesApi.list).mockResolvedValueOnce({ data: [{ id: 1, name: 'Senior Pastor' }] })
    const { result } = renderHook(() => usePastorRoles(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ id: 1, name: 'Senior Pastor' }])
  })

  it('throws when the roles request errors', async () => {
    const { pastorRolesApi } = await import('../services/api')
    vi.mocked(pastorRolesApi.list).mockResolvedValueOnce({ error: 'Boom' })
    const { result } = renderHook(() => usePastorRoles(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('returns an empty array when no roles data', async () => {
    const { pastorRolesApi } = await import('../services/api')
    vi.mocked(pastorRolesApi.list).mockResolvedValueOnce({ data: undefined })
    const { result } = renderHook(() => usePastorRoles(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.data).toEqual([]))
  })
})

describe('useChurchMembers', () => {
  it('fetches members for a church', async () => {
    vi.mocked(peopleApi.list).mockResolvedValueOnce({ data: { content: [{ id: 'm1', firstName: 'Mary' }], totalElements: 1, totalPages: 1 } })
    const { result } = renderHook(() => useChurchMembers(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeDefined()
  })

  it('does not fetch when churchId is null', async () => {
    const { result } = renderHook(() => useChurchMembers(null), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(peopleApi.list).not.toHaveBeenCalled()
  })
})

describe('usePerson', () => {
  it('fetches a single person by id', async () => {
    vi.mocked(peopleApi.get).mockResolvedValueOnce({ data: { id: 'p1', firstName: 'John' } })
    const { result } = renderHook(() => usePerson('p1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.firstName).toBe('John')
  })

  it('does not fetch when id is undefined', async () => {
    const { result } = renderHook(() => usePerson(undefined), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(peopleApi.get).not.toHaveBeenCalled()
  })
})
