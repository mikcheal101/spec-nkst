import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiClient } from './apiClient'

const fetchMock = vi.fn()
globalThis.fetch = fetchMock as any

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

let api: ReturnType<typeof createApiClient>

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api = createApiClient('https://api.example.com')
})

describe('HTTP methods', () => {
  it('get sends GET request with correct URL', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }))

    await api.get('/users')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBeUndefined()
    expect(options.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }))
  })

  it('post sends POST with JSON body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: '1' }))

    await api.post('/users', { name: 'John' })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify({ name: 'John' }))
  })

  it('put sends PUT with JSON body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await api.put('/users/1', { name: 'Jane' })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe('PUT')
    expect(options.body).toBe(JSON.stringify({ name: 'Jane' }))
  })

  it('delete sends DELETE request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.delete('/users/1')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe('DELETE')
  })

  it('post with undefined body omits body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.post('/action')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.body).toBeUndefined()
  })

  it('put with undefined body omits body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.put('/action')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.body).toBeUndefined()
  })
})

describe('Authorization header', () => {
  it('attaches Bearer token when token exists', async () => {
    localStorage.setItem('accessToken', 'mytoken')
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.get('/me')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer mytoken' }),
    )
  })

  it('does not attach Authorization when no token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}))

    await api.get('/me')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers).not.toHaveProperty('Authorization')
  })
})

describe('Response handling', () => {
  it('returns data on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ name: 'test' }))

    const result = await api.get('/item')

    expect(result).toEqual({ data: { name: 'test' } })
  })

  it('returns error on non-ok response with message field', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Not found' }, 404))

    const result = await api.get('/missing')

    expect(result).toEqual({ error: 'Not found' })
  })

  it('returns error on non-ok response with error field', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Forbidden' }, 403))

    const result = await api.get('/secret')

    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('returns fallback error when response has no message or error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500))

    const result = await api.get('/broken')

    expect(result).toEqual({ error: 'Request failed' })
  })

  it('returns empty object on 204 No Content', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204))

    const result = await api.get('/noop')

    expect(result).toEqual({})
  })

  it('returns network error on fetch failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network fail'))

    const result = await api.get('/down')

    expect(result).toEqual({ error: 'Network error. Please check your connection.' })
  })
})
