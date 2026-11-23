import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body } as any
}
describe('api more wrappers', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); localStorage.clear(); (globalThis as any).fetch = vi.fn() })
  it('covers dashboard/contribution/media/messaging/notification/payment/workflow/pastorRoles', async () => {
    const fetchMock = (globalThis.fetch as any)
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }))
    const api = await import('./api')
    await api.dashboardApi.getCounters()
    await api.pastorRolesApi.list()
    await api.contributionApi.listRequests({ churchId: '1' })
    await api.contributionApi.getRequest('1')
    await api.contributionApi.createRequest({})
    await api.contributionApi.listContributions({ churchId: '1' })
    await api.contributionApi.recordContribution({})
    await api.announcementApi.list()
    await api.mediaApi.listSermons()
    await api.mediaApi.getSermon('1')
    await api.mediaApi.createSermon({})
    await api.mediaApi.publishSermon('1')
    await api.mediaApi.listMediaAssets()
    await api.mediaApi.uploadMediaAsset({})
    await api.messagingApi.listConversations('1')
    await api.messagingApi.getMessages('1')
    await api.messagingApi.sendMessage('1', { text: 'hi' })
    await api.messagingApi.createConversation({})
    await api.notificationApi.listTemplates()
    await api.paymentApi.initialize({})
    await api.paymentApi.getStatus('ref')
    await api.workflowApi.getPendingTasks()
    await api.workflowApi.startWorkflow({})
    await api.workflowApi.takeAction('1', {})
    expect(fetchMock).toHaveBeenCalled()
  })

  it('covers mapping helpers and people/church param branches', async () => {
    const api = await import('./api')
    const fetchMock = (globalThis.fetch as any)
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 } }))
      .mockResolvedValueOnce(jsonResponse({ data: { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 } }))
      .mockResolvedValueOnce(jsonResponse({ data: { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 } }))
      .mockResolvedValueOnce(jsonResponse({ data: { content: [{ id: 1, firstName: 'A', lastName: 'B', gender: 'F' }] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { content: [{ id: 1, firstName: 'A', lastName: 'B', gender: 'X' }] } }))
    await api.churchApi.list(0, 5)
    await api.peopleApi.list({ churchId: '1' })
    await api.peopleApi.list({ search: 'x' })
    const elders = await api.eldersApi.list()
    const deacons = await api.deaconsApi.list()
    expect(elders.data?.[0].gender).toBe('Female')
    expect(deacons.data?.[0].gender).toBe('X')
  })

  it('covers refresh queue rejects/401 branch and non-json ok body', async () => {
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    const fetchMock = (globalThis.fetch as any)
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: 'n', refreshToken: 'r2' } }, 200))
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' })
    const api = await import('./api')
    const res = await api.authApi.listUsers()
    expect(res).toEqual({})
  })
})

  it('covers remaining api branches', async () => {
    const f = (globalThis.fetch as any)
    f.mockResolvedValue(jsonResponse({ data: {} }))
    const api = await import('./api')
    await api.authApi.stepUp('pw')
    await api.authApi.changePassword({ currentPassword: 'a', newPassword: 'b' })
    await api.churchApi.getSubChurches(1)
    await api.pastorRolesApi.get(1)
    await api.contributionApi.listRequests()
    await api.contributionApi.listContributions()
    await api.announcementApi.list()
    await api.announcementApi.acknowledge('1')
    await api.announcementApi.listEvents()
    await api.announcementApi.createEvent({})
    await api.announcementApi.updateEvent('1', {})
    await api.announcementApi.deleteEvent('1')
    await api.auditApi.listEvents()
    await api.deaconsApi.search('q')
    expect(api.mapDeaconToPerson({ id:1, firstName:'A', lastName:'B', gender: undefined } as any).gender).toBe('')
  })

  it('covers refreshAccessToken catch and queue 204 branch', async () => {
    localStorage.setItem('refreshToken', 'rt')
    let resolveRefresh: any
    const refreshP = new Promise(r => { resolveRefresh = r })
    const f = (globalThis.fetch as any)
    f
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockRejectedValueOnce(new Error('refresh boom')) // refreshAccessToken catch -> null
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockImplementationOnce(() => refreshP)
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' })
      .mockResolvedValueOnce(jsonResponse({ data: ['ok'] }, 200))
    const api = await import('./api')
    const r1 = await api.authApi.listUsers() // refresh throws, no access token -> login redirect
    expect(r1.error).toBe('Session expired. Please login again.')
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    const p1 = api.authApi.listUsers()
    const p2 = api.authApi.getMyPermissions()
    resolveRefresh(jsonResponse({ data: { accessToken: 'n', refreshToken: 'r2' } }, 200))
    expect(await p1).toEqual({})
    expect((await p2).data).toEqual(['ok'])
  })

  it('covers request branches with stepUp/getRoles/retry 204', async () => {
    localStorage.setItem('accessToken', 'old')
    localStorage.setItem('refreshToken', 'rt')
    const f = (globalThis.fetch as any)
    f
      .mockResolvedValueOnce(jsonResponse({ data: [] }, 200)) // getRoles
      .mockResolvedValueOnce(jsonResponse({ data: { stepUpToken: 's' } }, 200)) // stepUp
      .mockResolvedValueOnce(jsonResponse({}, 401)) // listUsers
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: 'n', refreshToken: 'r2' } }, 200)) // refresh
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' }) // retry 204
    const api = await import('./api')
    await api.authApi.getRoles('1')
    await api.authApi.stepUp('pw')
    expect(await api.authApi.listUsers()).toEqual({})
  })
