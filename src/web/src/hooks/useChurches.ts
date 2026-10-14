import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query'
import { churchApi, peopleApi, type Church, type ChurchRequest, type PageResponse } from '../services/api'
import { unwrap } from './useApi'

export function useChurches(page: number, size = 10, search?: string, sort?: string) {
  return useQuery<PageResponse<Church>>({
    queryKey: ['churches', page, size, search, sort],
    queryFn: () => unwrap(churchApi.list(page, size, search, sort)),
    placeholderData: (prev) => prev,
  })
}

export function useAllChurches(size = 200, enabled = true) {
  return useQuery<PageResponse<Church>>({
    queryKey: ['churches', 'all', size],
    queryFn: () => unwrap(churchApi.list(0, size)),
    enabled,
  })
}

export function useChurch(id: number | null) {
  return useQuery<Church>({
    queryKey: ['church', id],
    queryFn: () => unwrap(churchApi.get(id!)),
    enabled: id !== null,
  })
}

export function useCreateChurch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChurchRequest) => unwrap(churchApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['churches'] }),
  })
}

export function useUpdateChurch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChurchRequest }) => unwrap(churchApi.update(id, data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['churches'] })
      qc.invalidateQueries({ queryKey: ['church'] })
    },
  })
}

export function useDeleteChurch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unwrap(churchApi.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['churches'] }),
  })
}

export function useSubChurches(id: number | null) {
  return useQuery<Church[]>({
    queryKey: ['sub-churches', id],
    queryFn: async () => {
      const result = await unwrap(churchApi.getSubChurches(id!));
      if (Array.isArray(result)) {
        return result;
      }
      if (result && (result as any).content) {
        return (result as any).content;
      }
      if (result && (result as any).data) {
        const inner = (result as any).data;
        if (Array.isArray(inner)) {
          return inner;
        }
        if (inner && (inner as any).content) {
          return (inner as any).content;
        }
      }
      return [];
    },
    enabled: id !== null,
  })
}

export function useChurchesAdminStatus(churchIds: number[]) {
  const results = useQueries({
    queries: churchIds.map((id) => ({
      queryKey: ['church-admin-status', id],
      queryFn: async () => {
        const res = await peopleApi.hasChurchAdmin(id)
        return { id, hasAdmin: res.data ?? false }
      },
      staleTime: 30_000,
    })),
  })
  const map = new Map<number, boolean>()
  results.forEach((r) => {
    if (r.data) map.set(r.data.id, r.data.hasAdmin)
  })
  return map
}
