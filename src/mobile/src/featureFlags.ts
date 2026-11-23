import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useFeatureFlag = (key: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', key],
    queryFn: async () => {
      const response = await fetch(`/api/feature-flags?key=${encodeURIComponent(key)}`);
      if (!response.ok) {
        throw new Error('Feature flag fetch failed');
      }
      return response.json() as Promise<{ isEnabled: boolean }>;
    },
    staleTime: 60 * 1000,
    gcTime: 60 * 1000,
  });

  const [state, setState] = useState<boolean | null>(null);

  useEffect(() => {
    if (data != null) {
      setState(data.isEnabled);
    }
  }, [data]);

  return { state, isLoading };
};
