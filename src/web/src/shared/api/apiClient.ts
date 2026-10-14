export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string,
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
    if (res.status === 204) return {};

    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || 'Request failed' };
    }
    return { data };
  } catch {
    return { error: 'Network error. Please check your connection.' };
  }
}

export function createApiClient(baseUrl: string) {
  return {
    get<T>(endpoint: string) {
      return request<T>(endpoint, {}, baseUrl);
    },
    post<T>(endpoint: string, body?: unknown) {
      return request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, baseUrl);
    },
    put<T>(endpoint: string, body?: unknown) {
      return request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }, baseUrl);
    },
    delete<T>(endpoint: string) {
      return request<T>(endpoint, { method: 'DELETE' }, baseUrl);
    },
  };
}

export const API_BASE_URLS = {
  auth: import.meta.env.VITE_AUTH_API_URL || '',
  church: import.meta.env.VITE_CHURCH_API_URL || '',
  people: import.meta.env.VITE_PEOPLE_API_URL || '',
  contribution: import.meta.env.VITE_CONTRIBUTION_API_URL || '',
  announcement: import.meta.env.VITE_ANNOUNCEMENT_API_URL || '',
  media: import.meta.env.VITE_MEDIA_API_URL || '',
  messaging: import.meta.env.VITE_MESSAGING_API_URL || '',
  notification: import.meta.env.VITE_NOTIFICATION_API_URL || '',
  audit: import.meta.env.VITE_AUDIT_API_URL || '',
  payment: import.meta.env.VITE_PAYMENT_API_URL || '',
  workflow: import.meta.env.VITE_WORKFLOW_API_URL || '',
};
