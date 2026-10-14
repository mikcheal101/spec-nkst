import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesApi, type Role } from '../services/api'
import { unwrap } from './useApi'

export function useRolesList() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => unwrap(rolesApi.list()),
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Role, 'id'>) => unwrap(rolesApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Role, 'id'> }) => unwrap(rolesApi.update(id, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(rolesApi.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}
