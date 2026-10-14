import { useState, useCallback } from 'react';
import type { ApiResponse } from '../api/apiClient';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: false, error: null });

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setState({ data: null, loading: true, error: null });
    const res = await apiCall();
    if (res.error) {
      setState({ data: null, loading: false, error: res.error });
      return null;
    }
    setState({ data: res.data ?? null, loading: false, error: null });
    return res.data;
  }, []);

  const reset = useCallback(() => setState({ data: null, loading: false, error: null }), []);

  return { ...state, execute, reset };
}
