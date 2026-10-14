import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type DashboardCounters } from '../services/api'
import { unwrap } from './useApi'

export function useDashboardCounters() {
  return useQuery<DashboardCounters>({
    queryKey: ['dashboard', 'counters'],
    queryFn: () => unwrap(dashboardApi.getCounters()),
  })
}
