import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(overrides: Partial<Response>): Response {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({}),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic' as ResponseType,
    url: '',
    clone: function () { return this as unknown as Response },
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    ...overrides,
  }
}

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
})

async function getApi() {
  return await import('./api')
}

const pageData = { content: [{ id: 1, name: 'Main Church', address: '123 St' }], totalPages: 1, totalElements: 1, number: 0, size: 10, last: true, first: true, empty: false }

describe('request()', () => {
  it('sends GET with default headers', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: '1' } })),
      json: () => Promise.resolve({ data: { id: '1' } }),
    }))
    const api = await getApi()
    const result = await api.authApi.getRoles('user-1')
    expect(result.data).toEqual({ id: '1' })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:81/api/v1/users/user-1/roles',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('attaches Authorization header when token exists', async () => {
    localStorage.setItem('accessToken', 'test-token')
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: {} })),
      json: () => Promise.resolve({ data: {} }),
    }))
    const api = await getApi()
    await api.authApi.logout({ accessToken: 'test-token', refreshToken: 'test-refresh' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    )
  })

  it('returns error on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    }))
    const api = await getApi()
    const result = await api.authApi.login({ username: 'test', password: 'wrong' })
    expect(result.data).toBeUndefined()
    expect(result.error).toBe('Unauthorized')
  })

  it('returns empty on 204', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))
    const api = await getApi()
    const result = await api.churchApi.delete(1)
    expect(result.data).toBeUndefined()
    expect(result.error).toBeUndefined()
  })

  it('returns network error on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'))
    const api = await getApi()
    const result = await api.peopleApi.list()
    expect(result.data).toBeUndefined()
    expect(result.error).toMatch(/Network error/)
  })



  it('returns server error message from error field', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: 'Bad request' })),
      json: () => Promise.resolve({ error: 'Bad request' }),
    }))
    const api = await getApi()
    const result = await api.rolesApi.create({ name: '', permissions: [] })
    expect(result.error).toBe('Bad request')
  })

  it('uses status code fallback message when no server message', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 403,
      text: () => Promise.resolve(JSON.stringify({})),
      json: () => Promise.resolve({}),
    }))
    const api = await getApi()
    const result = await api.authApi.listUsers()
    expect(result.error).toBe('Access denied.')
  })

  it('returns generic status message for unknown status', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 500,
      text: () => Promise.resolve(JSON.stringify({})),
      json: () => Promise.resolve({}),
    }))
    const api = await getApi()
    const result = await api.messagingApi.listConversations('u1')
    expect(result.error).toMatch(/Request failed/)
  })

  it('handles JSON parse failure in response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve('not json'),
    }))
    const api = await getApi()
    const result = await api.auditApi.listEvents()
    expect(result.data).toBe('not json')
  })

  it('returns data from wrapped response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 42 } })),
      json: () => Promise.resolve({ data: { id: 42 } }),
    }))
    const api = await getApi()
    const result = await api.churchApi.get(1)
    expect(result.data).toEqual({ id: 42 })
  })

  it('retries on 401 and refreshes token', async () => {
    localStorage.setItem('accessToken', 'expired-token')
    localStorage.setItem('refreshToken', 'valid-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    }))
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })),
      json: () => Promise.resolve({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }),
    }))
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 1 } })),
      json: () => Promise.resolve({ data: { id: 1 } }),
    }))

    const api = await getApi()
    const result = await api.dashboardApi.getCounters()

    // retry path wraps response.data again
    expect(result.data).toEqual({ data: { id: 1 } })
    expect(localStorage.getItem('accessToken')).toBe('new-token')
  })

  it('redirects to login when refresh fails on 401 (no existing token)', async () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    }))

    const originalLocation = window.location
    // @ts-expect-error
    delete window.location
    window.location = { ...originalLocation, href: '' }

    const api = await getApi()
    const result = await api.rolesApi.list()

    expect(result.error).toMatch(/Session expired/)
    expect(window.location.href).toBe('/login')
  })

  it('redirects to dashboard when refresh fails on 401 with existing token', async () => {
    vi.useFakeTimers()
    localStorage.setItem('accessToken', 'expired-token')
    localStorage.removeItem('refreshToken')

    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    }))

    const originalLocation = window.location
    // @ts-expect-error
    delete window.location
    window.location = { ...originalLocation, href: '' }

    const api = await getApi()
    const result = await api.rolesApi.list()

    expect(result.error).toMatch(/Session expired/)
    vi.advanceTimersByTime(150)
    expect(window.location.href).toBe('/dashboard')
    vi.useRealTimers()
  })

  it('skips 401 handling for auth refresh endpoint', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    }))
    const api = await getApi()
    const result = await api.authApi.refreshToken({ refreshToken: 'rt' })
    expect(result.error).toBe('Unauthorized')
  })

  it('skips 401 handling for sign-in endpoint', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Invalid credentials' })),
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    }))
    const api = await getApi()
    const result = await api.authApi.login({ username: 'u', password: 'p' })
    expect(result.error).toBe('Invalid credentials')
  })

  it('skips 401 handling for sign-out endpoint', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    }))
    const api = await getApi()
    const result = await api.authApi.logout({ accessToken: 'at', refreshToken: 'rt' })
    expect(result.error).toBe('Unauthorized')
  })

  it('queues concurrent requests when refresh is already in progress and retries all', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    // First two calls: both 401 (triggers refresh, second one queues)
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    // Refresh token call
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })), json: () => Promise.resolve({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }) }))
    // Retries (order depends on microtask scheduling)
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { id: 1 } })), json: () => Promise.resolve({ data: { id: 1 } }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { id: 2 } })), json: () => Promise.resolve({ data: { id: 2 } }) }))

    const api = await getApi()
    const results = await Promise.allSettled([
      api.dashboardApi.getCounters(),
      api.dashboardApi.getCounters(),
    ])

    expect(results.length).toBe(2)
    // Both should have resolved (not rejected)
    results.forEach((r) => expect(r.status).toBe('fulfilled'))
    expect(localStorage.getItem('accessToken')).toBe('new-token')
  })

  it('handles 204 after token refresh', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })), json: () => Promise.resolve({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))

    const api = await getApi()
    const result = await api.churchApi.delete(1)
    expect(result.data).toBeUndefined()
    expect(result.error).toBeUndefined()
  })

  it('returns error when retry after refresh fails', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })), json: () => Promise.resolve({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 500, text: () => Promise.resolve(JSON.stringify({})), json: () => Promise.resolve({}) }))

    const api = await getApi()
    const result = await api.rolesApi.list()
    expect(result.error).toMatch(/Request failed after token refresh/)
  })
})

describe('authApi', () => {
  it('register sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { message: 'User registered' } })),
      json: () => Promise.resolve({ data: { message: 'User registered' } }),
    }))
    const api = await getApi()
    const result = await api.authApi.register({ username: 'newuser', password: 'secret' })
    expect(result.data).toEqual({ message: 'User registered' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/auth/register', expect.objectContaining({ method: 'POST' }))
  })

  it('login sends POST to sign-in', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'at', refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 } })),
      json: () => Promise.resolve({ data: { accessToken: 'at', refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 } }),
    }))
    const api = await getApi()
    const result = await api.authApi.login({ username: 'u', password: 'p' })
    expect(result.data?.accessToken).toBe('at')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/auth/sign-in', expect.objectContaining({ method: 'POST' }))
  })

  it('refreshToken sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-at' } })),
      json: () => Promise.resolve({ data: { accessToken: 'new-at' } }),
    }))
    const api = await getApi()
    const result = await api.authApi.refreshToken({ refreshToken: 'rt' })
    expect(result.data?.accessToken).toBe('new-at')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/auth/refresh', expect.objectContaining({ method: 'POST' }))
  })

  it('requestPasswordReset sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { message: 'OTP sent', expiresIn: 300 } })),
      json: () => Promise.resolve({ data: { message: 'OTP sent', expiresIn: 300 } }),
    }))
    const api = await getApi()
    const result = await api.authApi.requestPasswordReset({ phoneNumber: '+234' })
    expect(result.data?.message).toBe('OTP sent')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/auth/password-reset/request', expect.objectContaining({ method: 'POST' }))
  })

  it('confirmPasswordReset sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { message: 'Password reset' } })),
      json: () => Promise.resolve({ data: { message: 'Password reset' } }),
    }))
    const api = await getApi()
    const result = await api.authApi.confirmPasswordReset({ phoneNumber: '+234', otp: '123', newPassword: 'new' })
    expect(result.data?.message).toBe('Password reset')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/auth/password-reset/confirm', expect.objectContaining({ method: 'POST' }))
  })

  it('assignRole sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.authApi.assignRole('u1', 'ADMIN')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/users/u1/roles', expect.objectContaining({ method: 'POST' }))
  })

  it('revokeRole sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.authApi.revokeRole('u1', 'ADMIN')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/users/u1/roles/ADMIN', expect.objectContaining({ method: 'DELETE' }))
  })

  it('getProfile fetches profile', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { username: 'admin', firstName: 'Admin' } })),
      json: () => Promise.resolve({ data: { username: 'admin', firstName: 'Admin' } }),
    }))
    const api = await getApi()
    const result = await api.profileApi.getProfile()
    expect(result.data?.username).toBe('admin')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/profile', expect.any(Object))
  })

  it('updateProfile sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.profileApi.updateProfile({ firstName: 'John', lastName: 'Doe', tel: '123' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/profile', expect.objectContaining({ method: 'POST' }))
  })

  it('changePassword sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.authApi.changePassword({ currentPassword: 'old', newPassword: 'new' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/auth/change-password', expect.objectContaining({ method: 'PUT' }))
  })

  it('listUsers fetches users', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [{ id: 'u1', username: 'admin' }] })),
      json: () => Promise.resolve({ data: [{ id: 'u1', username: 'admin' }] }),
    }))
    const api = await getApi()
    const result = await api.authApi.listUsers()
    expect(result.data).toHaveLength(1)
  })

  it('getRoles fetches roles for a user', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: ['ADMIN'] })),
      json: () => Promise.resolve({ data: ['ADMIN'] }),
    }))
    const api = await getApi()
    const result = await api.authApi.getRoles('u1')
    expect(result.data).toEqual(['ADMIN'])
  })
})

describe('churchApi', () => {
  it('list sends GET to churches with pagination', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: pageData })),
      json: () => Promise.resolve({ data: pageData }),
    }))
    const api = await getApi()
    const result = await api.churchApi.list()
    expect(result.data?.content).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/churches?page=0&size=10', expect.any(Object))
  })

  it('get fetches a single church', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 1, name: 'Main' } })),
      json: () => Promise.resolve({ data: { id: 1, name: 'Main' } }),
    }))
    const api = await getApi()
    const result = await api.churchApi.get(1)
    expect(result.data?.name).toBe('Main')
  })

  it('create sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 1 } })),
      json: () => Promise.resolve({ data: { id: 1 } }),
    }))
    const api = await getApi()
    await api.churchApi.create({ name: 'New', address: 'Addr' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/churches', expect.objectContaining({ method: 'POST' }))
  })

  it('update sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.churchApi.update(1, { name: 'Updated', address: 'New' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/churches/1', expect.objectContaining({ method: 'PUT' }))
  })

  it('delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))
    const api = await getApi()
    const result = await api.churchApi.delete(1)
    expect(result.data).toBeUndefined()
  })

  it('getSubChurches sends GET', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.churchApi.getSubChurches(1)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/churches/sub-churches/1', expect.any(Object))
  })
})

describe('peopleApi', () => {
  it('list without churchId', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
      json: () => Promise.resolve({ data: [] }),
    }))
    const api = await getApi()
    await api.peopleApi.list()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/members', expect.any(Object))
  })

  it('list with churchId param', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
      json: () => Promise.resolve({ data: [] }),
    }))
    const api = await getApi()
    await api.peopleApi.list({ churchId: 'church-1' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/members/church-members/church-1', expect.any(Object))
  })

  it('list with search and sort params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
      json: () => Promise.resolve({ data: [] }),
    }))
    const api = await getApi()
    await api.peopleApi.list({ search: 'john', sort: 'name,asc', page: 1, size: 5, position: 'pastor', baptised: 'true' })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/members?'), expect.any(Object))
  })

  it('get fetches a person', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 'p1', firstName: 'John' } })),
      json: () => Promise.resolve({ data: { id: 'p1', firstName: 'John' } }),
    }))
    const api = await getApi()
    const result = await api.peopleApi.get('p1')
    expect(result.data?.firstName).toBe('John')
  })

  it('create sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 'p1' } })),
      json: () => Promise.resolve({ data: { id: 'p1' } }),
    }))
    const api = await getApi()
    await api.peopleApi.create({ firstName: 'John' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/members', expect.objectContaining({ method: 'POST' }))
  })

  it('update sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.peopleApi.update('p1', { firstName: 'Jane' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/members/p1', expect.objectContaining({ method: 'PUT' }))
  })

  it('delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))
    const api = await getApi()
    const result = await api.peopleApi.delete('p1')
    expect(result.data).toBeUndefined()
  })

  it('search sends GET with query', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
      json: () => Promise.resolve({ data: [] }),
    }))
    const api = await getApi()
    await api.peopleApi.search('john', 0, 10)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/members/search?query=john&page=0&size=10', expect.any(Object))
  })

  it('makeChurchAdmin sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: true })), json: () => Promise.resolve({ data: true }) }))
    const api = await getApi()
    await api.peopleApi.makeChurchAdmin('p1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/church-admin/p1', expect.objectContaining({ method: 'PUT' }))
  })

  it('hasChurchAdmin sends GET', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: false })), json: () => Promise.resolve({ data: false }) }))
    const api = await getApi()
    await api.peopleApi.hasChurchAdmin(1)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/church-admin/1', expect.any(Object))
  })
})

describe('rolesApi', () => {
  it('list fetches roles', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [{ id: 'r1', name: 'Admin' }] })),
      json: () => Promise.resolve({ data: [{ id: 'r1', name: 'Admin' }] }),
    }))
    const api = await getApi()
    const result = await api.rolesApi.list()
    expect(result.data).toHaveLength(1)
  })

  it('create sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.rolesApi.create({ name: 'New Role', permissions: [] })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/roles', expect.objectContaining({ method: 'POST' }))
  })

  it('update sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.rolesApi.update('r1', { name: 'Updated', permissions: [] })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/roles/r1', expect.objectContaining({ method: 'PUT' }))
  })

  it('delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))
    const api = await getApi()
    const result = await api.rolesApi.delete('r1')
    expect(result.data).toBeUndefined()
  })
})

describe('configApi', () => {
  it('get fetches config', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { churchName: 'Test', defaultCurrency: 'NGN' } })),
      json: () => Promise.resolve({ data: { churchName: 'Test', defaultCurrency: 'NGN' } }),
    }))
    const api = await getApi()
    const result = await api.configApi.get()
    expect(result.data?.churchName).toBe('Test')
  })

  it('update sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.configApi.update({ churchName: 'Updated', churchAddress: '', defaultCurrency: 'USD' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:81/api/v1/system/config', expect.objectContaining({ method: 'PUT' }))
  })
})

describe('dashboardApi', () => {
  it('getCounters fetches counters', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { members: 10 } })),
      json: () => Promise.resolve({ data: { members: 10 } }),
    }))
    const api = await getApi()
    const result = await api.dashboardApi.getCounters()
    expect(result.data?.members).toBe(10)
  })
})

describe('contributionApi', () => {
  it('listRequests', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.contributionApi.listRequests()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/contribution-requests', expect.any(Object))
  })

  it('listContributions with churchId', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.contributionApi.listContributions({ churchId: 'c1' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/contributions?churchId=c1', expect.any(Object))
  })

  it('recordContribution sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.contributionApi.recordContribution({ amount: 100 })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/contributions', expect.objectContaining({ method: 'POST' }))
  })

  it('createRequest sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.contributionApi.createRequest({ title: 'Building Fund' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/contribution-requests', expect.objectContaining({ method: 'POST' }))
  })

  it('listRequests with churchId param', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.contributionApi.listRequests({ churchId: 'c1' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/contribution-requests?churchId=c1', expect.any(Object))
  })

  it('listContributions without churchId', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.contributionApi.listContributions()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/contributions', expect.any(Object))
  })

  it('getRequest fetches by id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 'cr1' } })),
      json: () => Promise.resolve({ data: { id: 'cr1' } }),
    }))
    const api = await getApi()
    const result = await api.contributionApi.getRequest('cr1')
    expect(result.data?.id).toBe('cr1')
  })
})

describe('announcementApi', () => {
  it('list fetches announcements', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.announcementApi.list()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/announcements', expect.any(Object))
  })

  it('list unwraps the paginated content', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ content: [{ id: 1, title: 'Carol Service' }], totalElements: 1 })),
      json: () => Promise.resolve({ content: [{ id: 1, title: 'Carol Service' }], totalElements: 1 }),
    }))
    const api = await getApi()
    const result = await api.announcementApi.list()
    expect(result.error).toBeUndefined()
    expect(result.data).toEqual([{ id: 1, title: 'Carol Service' }])
  })

  it('get fetches by id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 'a1' } })),
      json: () => Promise.resolve({ data: { id: 'a1' } }),
    }))
    const api = await getApi()
    const result = await api.announcementApi.get('a1')
    expect(result.data?.id).toBe('a1')
  })

  it('create sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.announcementApi.create({ title: 'News' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/announcements', expect.objectContaining({ method: 'POST' }))
  })

  it('update sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.announcementApi.update('a1', { title: 'Updated' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/announcements/a1', expect.objectContaining({ method: 'PUT' }))
  })

  it('acknowledge sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.announcementApi.acknowledge('a1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/announcements/a1/acknowledgments', expect.objectContaining({ method: 'POST' }))
  })

  it('listEvents fetches events', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.announcementApi.listEvents()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/events', expect.any(Object))
  })

  it('createEvent sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.announcementApi.createEvent({ title: 'Event' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/events', expect.objectContaining({ method: 'POST' }))
  })

  it('delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve(''), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.announcementApi.delete('a1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/announcements/a1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('updateEvent sends PUT', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.announcementApi.updateEvent('e1', { title: 'Updated' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/events/e1', expect.objectContaining({ method: 'PUT' }))
  })

  it('deleteEvent sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve(''), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.announcementApi.deleteEvent('e1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:83/api/v1/events/e1', expect.objectContaining({ method: 'DELETE' }))
  })
})

describe('mediaApi', () => {
  it('listSermons', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.mediaApi.listSermons()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/sermons', expect.any(Object))
  })

  it('getSermon', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 's1' } })),
      json: () => Promise.resolve({ data: { id: 's1' } }),
    }))
    const api = await getApi()
    const result = await api.mediaApi.getSermon('s1')
    expect(result.data?.id).toBe('s1')
  })

  it('createSermon sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.mediaApi.createSermon({ title: 'Sermon' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/sermons', expect.objectContaining({ method: 'POST' }))
  })

  it('publishSermon sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.mediaApi.publishSermon('s1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/sermons/s1/publish', expect.objectContaining({ method: 'POST' }))
  })

  it('listMediaAssets', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.mediaApi.listMediaAssets()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/media-assets', expect.any(Object))
  })
})

describe('messagingApi', () => {
  it('listConversations', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.messagingApi.listConversations('u1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/users/u1/conversations', expect.any(Object))
  })

  it('getMessages', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.messagingApi.getMessages('conv1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/conversations/conv1/messages', expect.any(Object))
  })

  it('sendMessage sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.messagingApi.sendMessage('conv1', { content: 'Hello' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/conversations/conv1/messages', expect.objectContaining({ method: 'POST' }))
  })

  it('createConversation sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.messagingApi.createConversation({ participantIds: ['u1'] })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/conversations', expect.objectContaining({ method: 'POST' }))
  })
})

describe('notificationApi', () => {
  it('listTemplates', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.notificationApi.listTemplates()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/notifications/templates', expect.any(Object))
  })
})

describe('auditApi', () => {
  it('listEvents', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('[]'), json: () => Promise.resolve([]) }))
    const api = await getApi()
    await api.auditApi.listEvents()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/audit-events', expect.any(Object))
  })
})

describe('paymentApi', () => {
  it('initialize sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { reference: 'ref-1' } })),
      json: () => Promise.resolve({ data: { reference: 'ref-1' } }),
    }))
    const api = await getApi()
    const result = await api.paymentApi.initialize({ amount: 100 })
    expect(result.data).toEqual({ reference: 'ref-1' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/payments/initialize', expect.objectContaining({ method: 'POST' }))
  })

  it('getStatus', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { status: 'completed' } })),
      json: () => Promise.resolve({ data: { status: 'completed' } }),
    }))
    const api = await getApi()
    const result = await api.paymentApi.getStatus('ref-1')
    expect(result.data?.status).toBe('completed')
  })
})

describe('workflowApi', () => {
  it('getPendingTasks', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
      json: () => Promise.resolve({ data: [] }),
    }))
    const api = await getApi()
    const result = await api.workflowApi.getPendingTasks()
    expect(result.data).toEqual([])
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/workflows/tasks/my-pending', expect.any(Object))
  })

  it('startWorkflow sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.workflowApi.startWorkflow({ type: 'APPROVAL' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/workflows/start', expect.objectContaining({ method: 'POST' }))
  })

  it('takeAction sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.workflowApi.takeAction('step-1', { action: 'APPROVE' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/workflows/steps/step-1/action', expect.objectContaining({ method: 'POST' }))
  })
})

describe('mediaApi edge cases', () => {
  it('uploadMediaAsset sends POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve('{}'), json: () => Promise.resolve({}) }))
    const api = await getApi()
    await api.mediaApi.uploadMediaAsset({ title: 'Photo' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/media-assets', expect.objectContaining({ method: 'POST' }))
  })
})

describe('401 retry edge cases', () => {
  it('handles queued request with 204 response', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })), json: () => Promise.resolve({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: {} })), json: () => Promise.resolve({ data: {} }) }))
    // Queued retry returns 204
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))

    const api = await getApi()
    const results = await Promise.allSettled([
      api.dashboardApi.getCounters(),
      api.dashboardApi.getCounters(),
    ])

    expect(results[0].status).toBe('fulfilled')
    expect(results[1].status).toBe('fulfilled')
  })

  it('handles queued request retry failure', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    // First request returns 401 (triggers refresh)
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    // Second request returns 401 (enters queue since refresh in progress)
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    // Refresh succeeds
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })), json: () => Promise.resolve({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }) }))
    // First retry succeeds
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: {} })), json: () => Promise.resolve({ data: {} }) }))
    // Queued retry FAILS
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 500, text: () => Promise.resolve(JSON.stringify({})), json: () => Promise.resolve({}) }))

    const api = await getApi()
    const [r1, r2] = await Promise.allSettled([
      api.dashboardApi.getCounters(),
      api.dashboardApi.getCounters(),
    ])

    expect(r1.status).toBe('fulfilled')
    expect(r2.status).toBe('fulfilled')
    // The queued request should have an error
    const val2 = (r2 as PromiseFulfilledResult<any>).value
    expect(val2.error).toMatch(/Request failed after token refresh/)
  })

  it('handles refresh returning non-ok response', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    // Refresh returns non-ok
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 500, text: () => Promise.resolve(''), json: () => Promise.resolve({}) }))

    const originalLocation = window.location
    // @ts-expect-error
    delete window.location
    window.location = { ...originalLocation, href: '' }

    const api = await getApi()
    const result = await api.dashboardApi.getCounters()
    expect(result.error).toMatch(/Session expired/)
  })

  it('handles refresh returning ok but missing accessToken', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    // Refresh succeeds but body has no accessToken
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { message: 'ok' } })), json: () => Promise.resolve({ data: { message: 'ok' } }) }))

    const originalLocation = window.location
    // @ts-expect-error
    delete window.location
    window.location = { ...originalLocation, href: '' }

    const api = await getApi()
    const result = await api.dashboardApi.getCounters()
    expect(result.error).toMatch(/Session expired/)
  })

  it('handles network error during token refresh', async () => {
    vi.useFakeTimers()
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    // Refresh fetch fails
    mockFetch.mockRejectedValueOnce(new Error('Network error during refresh'))

    const originalLocation = window.location
    // @ts-expect-error
    delete window.location
    window.location = { ...originalLocation, href: '' }

    const api = await getApi()
    const result = await api.dashboardApi.getCounters()

    expect(result.error).toMatch(/Session expired/)
    vi.advanceTimersByTime(150)
    expect(window.location.href).toBe('/dashboard')
    vi.useRealTimers()
  })
})

describe('pastorsApi', () => {
  const pastorBackend = {
    id: 1, firstName: 'John', middleName: 'M', lastName: 'Doe',
    gender: 'M', tel: '123', emailAddress: 'j@d.com',
    pastorRole: { id: 1, name: 'SENIOR_PASTOR' },
    church: { id: 10, name: 'Main Church' },
  }

  it('list returns mapped pastors', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [pastorBackend], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [pastorBackend], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.list()
    expect(result.data).toHaveLength(1)
    expect(result.data![0].firstName).toBe('John')
    expect(result.data![0].gender).toBe('Male')
    expect(result.data![0].position).toBe('SENIOR_PASTOR')
    expect(result.data![0].church?.id).toBe(10)
    expect(result.data![0].pastorRoleId).toBe(1)
  })

  it('get returns mapped pastor', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: pastorBackend })),
      json: () => Promise.resolve({ data: pastorBackend }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.get('1')
    expect(result.data?.firstName).toBe('John')
    expect(result.data?.gender).toBe('Male')
    expect(result.data?.position).toBe('SENIOR_PASTOR')
  })

  it('create sends POST and returns mapped pastor', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: pastorBackend })),
      json: () => Promise.resolve({ data: pastorBackend }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.create({ memberId: 1, pastorRoleId: 1, churchId: 10 })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/pastors', expect.objectContaining({ method: 'POST' }))
    expect(result.data?.firstName).toBe('John')
  })

  it('update sends PUT and returns mapped pastor', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: pastorBackend })),
      json: () => Promise.resolve({ data: pastorBackend }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.update('1', { memberId: 1, pastorRoleId: 2, churchId: 10 })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/pastors/1', expect.objectContaining({ method: 'PUT' }))
    expect(result.data?.firstName).toBe('John')
  })

  it('delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))
    const api = await getApi()
    const result = await api.pastorsApi.delete('1')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/pastors/1', expect.objectContaining({ method: 'DELETE' }))
    expect(result.data).toBeUndefined()
  })

  it('list handles error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 500,
      text: () => Promise.resolve(JSON.stringify({ message: 'Server error' })),
      json: () => Promise.resolve({ message: 'Server error' }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.list()
    expect(result.error).toBe('Server error')
    expect(result.data).toBeUndefined()
  })

  it('get handles error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 404,
      text: () => Promise.resolve(JSON.stringify({ message: 'Not found' })),
      json: () => Promise.resolve({ message: 'Not found' }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.get('999')
    expect(result.error).toBe('Not found')
  })
})

describe('eldersApi', () => {
  const elderBackend = {
    id: 2, firstName: 'Jane', lastName: 'Smith',
    gender: 'F', tel: '456', emailAddress: 'j@s.com',
    pastorRole: null,
    church: { id: 10, name: 'Main Church' },
  }

  it('list returns mapped elders', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [elderBackend], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [elderBackend], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.list()
    expect(result.data).toHaveLength(1)
    expect(result.data![0].firstName).toBe('Jane')
    expect(result.data![0].gender).toBe('Female')
    expect(result.data![0].church?.id).toBe(10)
  })

  it('get returns mapped elder with churchId', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: elderBackend })),
      json: () => Promise.resolve({ data: elderBackend }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.get('2')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/elders/2', expect.any(Object))
    expect(result.data?.firstName).toBe('Jane')
    expect(result.data?.gender).toBe('Female')
    expect(result.data?.church?.name).toBe('Main Church')
  })

  it('create sends POST and returns mapped elder', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: elderBackend })),
      json: () => Promise.resolve({ data: elderBackend }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.create({ memberId: 2 })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/elders', expect.objectContaining({ method: 'POST' }))
    expect(result.data?.firstName).toBe('Jane')
  })

  it('delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))
    const api = await getApi()
    const result = await api.eldersApi.delete('2')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/elders/2', expect.objectContaining({ method: 'DELETE' }))
    expect(result.data).toBeUndefined()
  })

  it('list handles error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 500,
      text: () => Promise.resolve(JSON.stringify({ message: 'Server error' })),
      json: () => Promise.resolve({ message: 'Server error' }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.list()
    expect(result.error).toBe('Server error')
  })

  it('update sends PUT and returns mapped elder', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: elderBackend })),
      json: () => Promise.resolve({ data: elderBackend }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.update('2', { firstName: 'Jane' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/elders/2', expect.objectContaining({ method: 'PUT' }))
    expect(result.data?.firstName).toBe('Jane')
  })

  it('update handles error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 500,
      text: () => Promise.resolve(JSON.stringify({ message: 'Update failed' })),
      json: () => Promise.resolve({ message: 'Update failed' }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.update('2', { firstName: 'Jane' })
    expect(result.error).toBe('Update failed')
  })
})

describe('deaconsApi', () => {
  const deaconBackend = {
    id: 3, firstName: 'Paul', lastName: 'Baker',
    gender: 'M', pastorRole: { id: 3, name: 'DEACON' },
    church: { id: 5, name: 'Branch Church' },
  }

  it('list returns mapped deacons', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [deaconBackend], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [deaconBackend], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.list()
    expect(result.data).toHaveLength(1)
    expect(result.data![0].firstName).toBe('Paul')
    expect(result.data![0].gender).toBe('Male')
    expect(result.data![0].position).toBe('DEACON')
  })

  it('get returns mapped deacon', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: deaconBackend })),
      json: () => Promise.resolve({ data: deaconBackend }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.get('3')
    expect(result.data?.firstName).toBe('Paul')
    expect(result.data?.position).toBe('DEACON')
    expect(result.data?.church?.name).toBe('Branch Church')
  })

  it('create sends POST and returns mapped deacon', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: deaconBackend })),
      json: () => Promise.resolve({ data: deaconBackend }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.create({ firstName: 'Paul' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/deacons', expect.objectContaining({ method: 'POST' }))
    expect(result.data?.firstName).toBe('Paul')
  })

  it('update sends PUT and returns mapped deacon', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: deaconBackend })),
      json: () => Promise.resolve({ data: deaconBackend }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.update('3', { firstName: 'Paul' })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/deacons/3', expect.objectContaining({ method: 'PUT' }))
    expect(result.data?.firstName).toBe('Paul')
  })

  it('delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 204, text: () => Promise.resolve('') }))
    const api = await getApi()
    const result = await api.deaconsApi.delete('3')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/deacons/3', expect.objectContaining({ method: 'DELETE' }))
    expect(result.data).toBeUndefined()
  })

  it('list handles error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: false, status: 500,
      text: () => Promise.resolve(JSON.stringify({ message: 'Server error' })),
      json: () => Promise.resolve({ message: 'Server error' }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.list()
    expect(result.error).toBe('Server error')
  })
})

describe('pastorRolesApi', () => {
  it('list returns roles', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [{ id: 1, name: 'SENIOR_PASTOR' }, { id: 2, name: 'ASSOCIATE_PASTOR' }], totalPages: 1, totalElements: 2, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [{ id: 1, name: 'SENIOR_PASTOR' }, { id: 2, name: 'ASSOCIATE_PASTOR' }], totalPages: 1, totalElements: 2, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.pastorRolesApi.list()
    expect(result.data).toHaveLength(2)
    expect(result.data![0].name).toBe('SENIOR_PASTOR')
  })

  it('get returns single role', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 1, name: 'SENIOR_PASTOR' } })),
      json: () => Promise.resolve({ data: { id: 1, name: 'SENIOR_PASTOR' } }),
    }))
    const api = await getApi()
    const result = await api.pastorRolesApi.get(1)
    expect(result.data?.id).toBe(1)
    expect(result.data?.name).toBe('SENIOR_PASTOR')
  })
})

describe('mapper edge cases', () => {
  it('pastor with gender F and no church/pastorRole', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [{ id: 10, firstName: 'Sarah', lastName: 'W', middleName: '', gender: 'F', tel: null, emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [{ id: 10, firstName: 'Sarah', lastName: 'W', middleName: '', gender: 'F', tel: null, emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.list()
    expect(result.data![0].gender).toBe('Female')
    expect(result.data![0].church).toBeUndefined()
    expect(result.data![0].position).toBe('')
    expect(result.data![0].tel).toBe('')
  })

  it('pastor with unknown gender', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [{ id: 11, firstName: 'X', lastName: 'Y', gender: 'Other', tel: '123', emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [{ id: 11, firstName: 'X', lastName: 'Y', gender: 'Other', tel: '123', emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.pastorsApi.list()
    expect(result.data![0].gender).toBe('Other')
  })

  it('elder with gender M and no church/pastorRole', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [{ id: 20, firstName: 'Bob', lastName: 'A', gender: 'M', tel: null, emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [{ id: 20, firstName: 'Bob', lastName: 'A', gender: 'M', tel: null, emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.list()
    expect(result.data![0].gender).toBe('Male')
    expect(result.data![0].church).toBeUndefined()
  })

  it('elder with unknown gender and empty tel', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [{ id: 21, firstName: 'Z', lastName: 'W', gender: 'Other', tel: '', emailAddress: '', pastorRole: { id: 1, name: 'ELDER' }, church: { id: 5, name: 'Church' } }], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [{ id: 21, firstName: 'Z', lastName: 'W', gender: 'Other', tel: '', emailAddress: '', pastorRole: { id: 1, name: 'ELDER' }, church: { id: 5, name: 'Church' } }], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.eldersApi.list()
    expect(result.data![0].gender).toBe('Other')
    expect(result.data![0].position).toBe('ELDER')
  })

  it('deacon with gender F and no church/pastorRole', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [{ id: 30, firstName: 'Mary', lastName: 'C', gender: 'F', tel: null, emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [{ id: 30, firstName: 'Mary', lastName: 'C', gender: 'F', tel: null, emailAddress: null, pastorRole: null, church: null }], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.list()
    expect(result.data![0].gender).toBe('Female')
    expect(result.data![0].church).toBeUndefined()
    expect(result.data![0].position).toBe('')
    expect(result.data![0].tel).toBe('')
  })

  it('deacon with unknown gender', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { content: [{ id: 31, firstName: 'Q', lastName: 'R', gender: '', tel: '999', emailAddress: 'q@r.com', pastorRole: { id: 2, name: 'DEACON' }, church: { id: 1, name: 'C1' } }], totalPages: 1, totalElements: 1, size: 100, number: 0 } })),
      json: () => Promise.resolve({ data: { content: [{ id: 31, firstName: 'Q', lastName: 'R', gender: '', tel: '999', emailAddress: 'q@r.com', pastorRole: { id: 2, name: 'DEACON' }, church: { id: 1, name: 'C1' } }], totalPages: 1, totalElements: 1, size: 100, number: 0 } }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.list()
    expect(result.data![0].gender).toBe('')
  })
})

describe('api ternary branch coverage', () => {
  const errResp = (msg: string) => mockResponse({
    ok: false, status: 500,
    text: () => Promise.resolve(JSON.stringify({ message: msg })),
    json: () => Promise.resolve({ message: msg }),
  })
  const pageContent = (content: unknown[] = []) => mockResponse({
    ok: true, status: 200,
    text: () => Promise.resolve(JSON.stringify({ data: { content, totalPages: 1, totalElements: content.length, size: 100, number: 0 } })),
    json: () => Promise.resolve({ data: { content, totalPages: 1, totalElements: content.length, size: 100, number: 0 } }),
  })
  const noContentResp = mockResponse({
    ok: true, status: 200,
    text: () => Promise.resolve(JSON.stringify({ data: {} })),
    json: () => Promise.resolve({ data: {} }),
  })

  it('pastorsApi.list error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('fail'))
    const api = await getApi()
    const r = await api.pastorsApi.list()
    expect(r.error).toBe('fail')
  })
  it('pastorsApi.list with empty content', async () => {
    mockFetch.mockResolvedValueOnce(noContentResp)
    const api = await getApi()
    const r = await api.pastorsApi.list()
    expect(r.data).toEqual([])
  })
  it('pastorsApi.get error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('nope'))
    const api = await getApi()
    const r = await api.pastorsApi.get('1')
    expect(r.error).toBe('nope')
  })
  it('pastorsApi.create error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('create fail'))
    const api = await getApi()
    const r = await api.pastorsApi.create({ memberId: 1, pastorRoleId: 1, churchId: 1 })
    expect(r.error).toBe('create fail')
  })
  it('pastorsApi.update error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('update fail'))
    const api = await getApi()
    const r = await api.pastorsApi.update('1', { memberId: 1, pastorRoleId: 1, churchId: 1 })
    expect(r.error).toBe('update fail')
  })

  it('eldersApi.get error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('get fail'))
    const api = await getApi()
    const r = await api.eldersApi.get('1')
    expect(r.error).toBe('get fail')
  })
  it('eldersApi.create error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('create fail'))
    const api = await getApi()
    const r = await api.eldersApi.create({ memberId: 1 })
    expect(r.error).toBe('create fail')
  })

  it('deaconsApi.get error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('get fail'))
    const api = await getApi()
    const r = await api.deaconsApi.get('1')
    expect(r.error).toBe('get fail')
  })
  it('deaconsApi.create error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('create fail'))
    const api = await getApi()
    const r = await api.deaconsApi.create({ memberId: 1 })
    expect(r.error).toBe('create fail')
  })
  it('deaconsApi.update error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('update fail'))
    const api = await getApi()
    const r = await api.deaconsApi.update('1', { firstName: 'A' })
    expect(r.error).toBe('update fail')
  })

  it('deaconsApi.search without page/size', async () => {
    mockFetch.mockResolvedValueOnce(pageContent([]))
    const api = await getApi()
    await api.deaconsApi.search('test')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('query=test'), expect.any(Object))
  })
  it('deaconsApi.search with page and size', async () => {
    mockFetch.mockResolvedValueOnce(pageContent([]))
    const api = await getApi()
    await api.deaconsApi.search('test', 2, 20)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object))
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('size=20'), expect.any(Object))
  })

  it('pastorRolesApi.list error branch', async () => {
    mockFetch.mockResolvedValueOnce(errResp('roles fail'))
    const api = await getApi()
    const r = await api.pastorRolesApi.list()
    expect(r.error).toBe('roles fail')
  })
  it('pastorRolesApi.list with empty content', async () => {
    mockFetch.mockResolvedValueOnce(noContentResp)
    const api = await getApi()
    const r = await api.pastorRolesApi.list()
    expect(r.data).toEqual([])
  })
})

describe('toPersonRequest edge cases', () => {
  it('create deacon with no church (churchId=null)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 1, firstName: 'A', lastName: 'B', gender: 'M', church: null } })),
      json: () => Promise.resolve({ data: { id: 1, firstName: 'A', lastName: 'B', gender: 'M', church: null } }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.update('1', { firstName: 'A', lastName: 'B', gender: 'Other', church: undefined })
    expect(result.data?.firstName).toBe('A')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.churchId).toBeNull()
    expect(body.gender).toBe('Other')
  })

  it('create deacon with Female gender', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 2, firstName: 'B', lastName: 'C', gender: 'F' } })),
      json: () => Promise.resolve({ data: { id: 2, firstName: 'B', lastName: 'C', gender: 'F' } }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.update('2', { firstName: 'B', lastName: 'C', gender: 'Female', church: undefined })
    expect(result.data?.gender).toBe('Female')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.gender).toBe('F')
    expect(body.churchId).toBeNull()
  })

  it('create deacon with Male gender', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 3, firstName: 'C', lastName: 'D', gender: 'M' } })),
      json: () => Promise.resolve({ data: { id: 3, firstName: 'C', lastName: 'D', gender: 'M' } }),
    }))
    const api = await getApi()
    const result = await api.deaconsApi.update('3', { firstName: 'C', lastName: 'D', gender: 'Male', church: { id: '7', name: 'X', address: '' } })
    expect(result.data?.gender).toBe('Male')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.gender).toBe('M')
    expect(body.churchId).toBe(7)
  })
})

describe('api query param edge cases', () => {
  it('churchApi.list with search and sort', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: pageData })),
      json: () => Promise.resolve({ data: pageData }),
    }))
    const api = await getApi()
    await api.churchApi.list(0, 10, 'grace', 'name,asc')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('search=grace'), expect.any(Object))
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sort=name%2Casc'), expect.any(Object))
  })

  it('peopleApi.list with all params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
      json: () => Promise.resolve({ data: [] }),
    }))
    const api = await getApi()
    await api.peopleApi.list({ page: 2, size: 20, search: 'john', position: 'pastor', sort: 'name,asc', baptised: 'true' })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object))
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('size=20'), expect.any(Object))
  })

  it('peopleApi.search without page/size', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
      json: () => Promise.resolve({ data: [] }),
    }))
    const api = await getApi()
    await api.peopleApi.search('test')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:82/api/v1/members/search?query=test', expect.any(Object))
  })

  it('queued request retry returns 401 after refresh', async () => {
    localStorage.setItem('accessToken', 'expired')
    localStorage.setItem('refreshToken', 'good-refresh')

    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })), json: () => Promise.resolve({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: {} })), json: () => Promise.resolve({ data: {} }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })), json: () => Promise.resolve({ message: 'Unauthorized' }) }))

    const api = await getApi()
    const results = await Promise.allSettled([
      api.dashboardApi.getCounters(),
      api.dashboardApi.getCounters(),
    ])
    expect(results[0].status).toBe('fulfilled')
    expect(results[1].status).toBe('fulfilled')
    const val = (results[1] as PromiseFulfilledResult<any>).value
    expect(val.error).toMatch(/don't have permission/)
  })
})

describe('request internals', () => {
  it('retry after refresh returns 401 triggers permission error', async () => {
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'refresh')
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(''), json: () => Promise.resolve({}) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new', refreshToken: 'r' } })), json: () => Promise.resolve({ data: { accessToken: 'new', refreshToken: 'r' } }) }))
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(''), json: () => Promise.resolve({}) }))
    const api = await getApi()
    const r = await api.dashboardApi.getCounters()
    expect(r.error).toMatch(/don't have permission/)
  })

  it('single request session expired when no refresh token', async () => {
    localStorage.removeItem('refreshToken')
    localStorage.setItem('accessToken', 'old')
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(''), json: () => Promise.resolve({}) }))
    const api = await getApi()
    const r = await api.dashboardApi.getCounters()
    expect(r.error).toBe('Session expired. Please login again.')
  })

  it('single request session expired when had no previous token', async () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 401, text: () => Promise.resolve(''), json: () => Promise.resolve({}) }))
    const api = await getApi()
    const r = await api.dashboardApi.getCounters()
    expect(r.error).toBe('Session expired. Please login again.')
  })
})
