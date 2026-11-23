import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { configApi, type SystemConfig, type SystemConfigurationEntry } from '../services/api'
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

export function useSystemConfigurations() {
  return useQuery<SystemConfigurationEntry[]>({
    queryKey: ['system-configurations'],
    queryFn: () => unwrap(configApi.list()),
  })
}

export function useUpsertSystemConfiguration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description?: string }) => unwrap(configApi.upsert(key, value, description)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-configurations'] }),
  })
}
