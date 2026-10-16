import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export const useFeatureFlag = (key: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', key],
    queryFn: async () => {
      const response = await fetch(`/api/feature-flags?key=${key}`)
      if (!response.ok) {
        throw new Error('Feature flag fetch failed')
      }
      return response.json()
    },
    staleTime: 60 * 1000,
    cacheTime: 60 * 1000,
  })

  const [state, setState] = useState<boolean | null>(null)

  useEffect(() => {
    if (data !== null) {
      setState(data.isEnabled)
    }
  }, [data])

  return { state, isLoading }
}