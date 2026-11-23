import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function okResponse(body: unknown = {}) {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
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
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response
}

/*
 * When service-specific URLs are not configured the API layer must fall back
 * to the shared API base (which itself falls back to a relative empty base so
 * the nginx reverse proxy resolves the call). These tests explicitly blank the
 * environment so both sides of every `||` fallback are exercised.
 */
describe('API base URL fallbacks', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_AUTH_API_URL', '')
    vi.stubEnv('VITE_PROFILE_API_URL', '')
    vi.stubEnv('VITE_CHURCH_API_URL', '')
    vi.stubEnv('VITE_PEOPLE_API_URL', '')
    vi.stubEnv('VITE_CONTRIBUTION_API_URL', '')
    vi.stubEnv('VITE_ANNOUNCEMENT_API_URL', '')
    vi.stubEnv('VITE_MEDIA_API_URL', '')
    vi.stubEnv('VITE_MESSAGING_API_URL', '')
    vi.stubEnv('VITE_NOTIFICATION_API_URL', '')
    vi.stubEnv('VITE_AUDIT_API_URL', '')
    vi.stubEnv('VITE_DASHBOARD_API_URL', '')
    vi.stubEnv('VITE_PAYMENT_API_URL', '')
    vi.stubEnv('VITE_WORKFLOW_API_URL', '')
    localStorage.clear()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(okResponse({}))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('routes every service through the shared fallback base', async () => {
    const api = await import('./api')

    await api.authApi.getRoles('user-1')
    await api.profileApi.getProfile()
    await api.churchApi.list()
    await api.peopleApi.list()
    await api.contributionApi.listRequests()
    await api.announcementApi.list()
    await api.mediaApi.listSermons()
    await api.messagingApi.listConversations('user-1')
    await api.notificationApi.listTemplates()
    await api.auditApi.listEvents()
    await api.dashboardApi.getCounters()
    await api.paymentApi.initialize({ amount: 100, email: 'qa@example.com' } as never)
    await api.workflowApi.getPendingTasks()

    const urls = mockFetch.mock.calls.map(([url]) => String(url))
    expect(urls).toHaveLength(13)
    for (const url of urls) {
      expect(url).toMatch(/^\/api\//)
    }
  })

  it('exposes blank base URLs for every service when none are configured', async () => {
    const { API_BASE_URLS } = await import('../shared/api/apiClient')
    expect(Object.values(API_BASE_URLS)).toEqual(Array(11).fill(''))
  })
})
