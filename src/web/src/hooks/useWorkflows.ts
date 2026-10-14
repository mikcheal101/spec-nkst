import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workflowApi } from '../services/api'
import { unwrap } from './useApi'

export function usePendingTasks() {
  return useQuery({
    queryKey: ['pendingTasks'],
    queryFn: () => unwrap(workflowApi.getPendingTasks()),
  })
}

export function useTakeAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: Record<string, unknown> }) => unwrap(workflowApi.takeAction(stepId, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingTasks'] }),
  })
}
