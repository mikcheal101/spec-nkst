// React Query hooks for People, Pastors, Elders, and Deacons.
// Each resource has list, get, create, update, and delete hooks.
// Pastors/Elders/Deacons have their own API endpoints (pastor-service).
// Members use the people-service endpoint.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { peopleApi, pastorsApi, eldersApi, deaconsApi, pastorRolesApi, type Person, type PageResponse } from '../services/api'
import { unwrap } from './useApi'

export function usePastorRoles() {
  return useQuery<{ id: number; name: string }[]>({
    queryKey: ['pastor-roles'],
    queryFn: async () => {
      const res = await pastorRolesApi.list()
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
  })
}

export function usePeopleList(params?: { churchId?: string; search?: string; position?: string; page?: number; size?: number; sort?: string; baptised?: string }) {
  return useQuery<PageResponse<Person>>({
    queryKey: ['people', params],
    queryFn: () => unwrap(peopleApi.list(params)),
  })
}

export function useChurchMembers(churchId: number | null) {
  return useQuery<PageResponse<Person>>({
    queryKey: ['church-members', churchId],
    queryFn: () => unwrap(peopleApi.list({ churchId: String(churchId!) })),
    enabled: !!churchId,
  })
}

export function usePerson(id: string | number | undefined) {
  return useQuery<Person>({
    queryKey: ['person', id],
    queryFn: () => unwrap(peopleApi.get(String(id))),
    enabled: !!id,
  })
}

export function useCreatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Person>) => unwrap(peopleApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['people'] }),
  })
}

export function useUpdatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Person> }) => unwrap(peopleApi.update(String(id), data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['people'] }),
  })
}

export function useDeletePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => unwrap(peopleApi.delete(String(id))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['people'] }),
  })
}

// ─── Pastors ───

export function usePastorsList() {
  return useQuery<Person[]>({
    queryKey: ['pastors'],
    queryFn: () => unwrap(pastorsApi.list()),
  })
}

export function usePastor(id: string | undefined) {
  return useQuery<Person>({
    queryKey: ['pastor', id],
    queryFn: () => unwrap(pastorsApi.get(id!)),
    enabled: !!id,
  })
}

export function useCreatePastor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { memberId: number; pastorRoleId: number; churchId: number }) => unwrap(pastorsApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pastors'] }),
  })
}

export function useUpdatePastor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { memberId: number; pastorRoleId: number; churchId: number } }) => unwrap(pastorsApi.update(id, data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pastors'] }); qc.invalidateQueries({ queryKey: ['pastor'] }) },
  })
}

export function useDeletePastor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(pastorsApi.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pastors'] }),
  })
}

// ─── Elders ───

export function useEldersList() {
  return useQuery<Person[]>({
    queryKey: ['elders'],
    queryFn: () => unwrap(eldersApi.list()),
  })
}

export function useElder(id: string | undefined) {
  return useQuery<Person>({
    queryKey: ['elder', id],
    queryFn: () => unwrap(eldersApi.get(id!)),
    enabled: !!id,
  })
}

export function useCreateElder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { memberId: number }) => unwrap(eldersApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['elders'] }),
  })
}

export function useDeleteElder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(eldersApi.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['elders'] }),
  })
}

export function useUpdateElder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) => unwrap(eldersApi.update(id, data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['elders'] }); qc.invalidateQueries({ queryKey: ['elder'] }) },
  })
}

// ─── Deacons ───

export function useDeaconsList() {
  return useQuery<Person[]>({
    queryKey: ['deacons'],
    queryFn: () => unwrap(deaconsApi.list()),
  })
}

export function useDeacon(id: string | undefined) {
  return useQuery<Person>({
    queryKey: ['deacon', id],
    queryFn: () => unwrap(deaconsApi.get(id!)),
    enabled: !!id,
  })
}

export function useCreateDeacon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { memberId: number }) => unwrap(deaconsApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deacons'] }),
  })
}

export function useUpdateDeacon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) => unwrap(deaconsApi.update(id, data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deacons'] }); qc.invalidateQueries({ queryKey: ['deacon'] }) },
  })
}

export function useDeleteDeacon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(deaconsApi.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deacons'] }),
  })
}

// ─── Church Admin ───

export function useMakeChurchAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => unwrap(peopleApi.makeChurchAdmin(String(id))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['people'] }),
  })
}
