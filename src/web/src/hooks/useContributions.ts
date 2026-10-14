import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contributionApi } from '../services/api'
import { unwrap } from './useApi'

export function useContributionsList(params?: { churchId?: string }) {
  return useQuery({
    queryKey: ['contributions', params],
    queryFn: () => unwrap(contributionApi.listContributions(params)),
  })
}

export function useRecordContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => unwrap(contributionApi.recordContribution(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contributions'] }),
  })
}
