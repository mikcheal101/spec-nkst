import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../services/api'
import { unwrap } from './useApi'

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: () => unwrap(notificationApi.listTemplates()),
  })
}
