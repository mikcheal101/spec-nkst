import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { configApi, type SystemConfig } from '../services/api'
import { unwrap } from './useApi'

export function useConfig() {
  return useQuery<SystemConfig>({
    queryKey: ['config'],
    queryFn: () => unwrap(configApi.get()),
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SystemConfig) => unwrap(configApi.update(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  })
}
