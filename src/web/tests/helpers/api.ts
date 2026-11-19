import type { APIRequestContext } from '@playwright/test'

const API = '/api/v1'

export async function apiToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/sign-in`, {
    data: { username: 'super-admin', password: 'super-admin' },
  })
  const body = await res.json()
  return body?.token ?? body?.data?.token ?? body?.accessToken ?? body?.data?.accessToken
}

async function authHeaders(request: APIRequestContext) {
  const token = await apiToken(request)
  return { Authorization: `Bearer ${token}` }
}

/** Remove any churches whose name starts with the given prefix. */
export async function cleanupChurches(request: APIRequestContext, prefix: string) {
  const headers = await authHeaders(request)
  const res = await request.get(`${API}/churches?page=0&size=200`, { headers })
  if (!res.ok()) return
  const body = await res.json()
  const content: Array<{ id: number; name?: string }> = body?.content ?? []
  for (const church of content) {
    if (church.name?.toUpperCase().startsWith(prefix.toUpperCase())) {
      await request.delete(`${API}/churches/${church.id}`, { headers })
    }
  }
}

/** Remove any members whose last name starts with the given prefix. */
export async function cleanupMembers(request: APIRequestContext, lastNamePrefix: string) {
  const headers = await authHeaders(request)
  const res = await request.get(`${API}/members?page=0&size=200`, { headers })
  if (!res.ok()) return
  const body = await res.json()
  const content: Array<{ id: number; lastName?: string }> = body?.content ?? []
  for (const member of content) {
    if (member.lastName?.startsWith(lastNamePrefix)) {
      await request.delete(`${API}/members/${member.id}`, { headers })
    }
  }
}
