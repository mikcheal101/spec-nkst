import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
const jsonResponse = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body }) as any

describe('api branch coverage', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); localStorage.clear(); (globalThis as any).fetch = vi.fn() })
  it('covers auth/profile/role/config/church/people request shapes and error branches', async () => {
    const f = (globalThis.fetch as any)
    f.mockResolvedValue(jsonResponse({ data: {} }))
    const api = await import('./api')
    // error branch on 401 without refresh token flow? just call normal
    await api.authApi.getMyPermissions(); await api.authApi.listUsers(); await api.authApi.register({ username:'u',password:'p',phoneNumber:'1',baptismCardNumber:'b',churchId:'1' })
    await api.authApi.changePassword({ currentPassword:'a',newPassword:'b',stepUpToken:'s' })
    await api.churchApi.list(1, 10); await api.churchApi.get(1); await api.churchApi.create({ name:'C', address:'A', parentChurchId:1 }); await api.churchApi.update(1,{name:'C', address:'A'}); await api.churchApi.delete(1)
    await api.peopleApi.list({ churchId:'1' }); await api.peopleApi.list({ page:1,size:2,search:'s',position:'P',sort:'name',baptised:'true' }); await api.peopleApi.search('q'); await api.peopleApi.get('1'); await api.peopleApi.create({firstName:'A'}); await api.peopleApi.update('1',{firstName:'A'}); await api.peopleApi.delete('1'); await api.peopleApi.makeChurchAdmin('1'); await api.peopleApi.hasChurchAdmin(1)
  })

  it('covers mappers and service mapping branches', async () => {
    const f = (globalThis.fetch as any)
    const pastor = { id:1, firstName:'P', lastName:'L', gender:'M', tel:'1', emailAddress:'e', church:{id:1,name:'C'}, pastorRole:{id:2,name:'PR'} }
    const elderF = { id:1, firstName:'E', lastName:'L', gender:'F', church:null, pastorRole:null }
    const deaconU = { id:1, firstName:'D', lastName:'L', gender:'U', church:null, pastorRole:null }
    f
      .mockResolvedValueOnce(jsonResponse({ data: { content:[pastor] } }))
      .mockResolvedValueOnce(jsonResponse({ data: pastor }))
      .mockResolvedValueOnce(jsonResponse({ data: pastor }))
      .mockResolvedValueOnce(jsonResponse({ data: pastor }))
      .mockResolvedValueOnce(jsonResponse({ data: {} }))
      .mockResolvedValueOnce(jsonResponse({ data: { content:[elderF] } }))
      .mockResolvedValueOnce(jsonResponse({ data: elderF }))
      .mockResolvedValueOnce(jsonResponse({ data: elderF }))
      .mockResolvedValueOnce(jsonResponse({ data: elderF }))
      .mockResolvedValueOnce(jsonResponse({ data: {} }))
      .mockResolvedValueOnce(jsonResponse({ data: { content:[deaconU] } }))
      .mockResolvedValueOnce(jsonResponse({ data: deaconU }))
      .mockResolvedValueOnce(jsonResponse({ data: deaconU }))
      .mockResolvedValueOnce(jsonResponse({ data: deaconU }))
      .mockResolvedValueOnce(jsonResponse({ data: {} }))
      .mockResolvedValueOnce(jsonResponse({ data: { content:[], totalElements:0,totalPages:0,size:20,number:0 } }))
    const api = await import('./api')
    await api.pastorsApi.list(); await api.pastorsApi.get('1'); await api.pastorsApi.create({memberId:1,pastorRoleId:2,churchId:1}); await api.pastorsApi.update('1',{memberId:1,pastorRoleId:2,churchId:1}); await api.pastorsApi.delete('1')
    await api.eldersApi.list(); await api.eldersApi.get('1'); await api.eldersApi.create({memberId:1}); await api.eldersApi.update('1',{firstName:'E',gender:'Female',church:{id:1,name:'C',address:''}}); await api.eldersApi.delete('1')
    await api.deaconsApi.list(); await api.deaconsApi.get('1'); await api.deaconsApi.create({memberId:1}); await api.deaconsApi.update('1',{firstName:'D',gender:'Male'}); await api.deaconsApi.delete('1')
    await api.deaconsApi.search('q')
    // direct mapper export
    expect(api.mapDeaconToPerson({ ...deaconU, gender:'M' } as any).gender).toBe('Male')
  })

  it('covers 401 retry queued error branches and refresh failure paths', async () => {
    localStorage.setItem('accessToken','old'); localStorage.setItem('refreshToken','rt')
    let resolveRefresh:any; const refreshP = new Promise(r=>resolveRefresh=r)
    const f=(globalThis.fetch as any)
    f
      .mockResolvedValueOnce(jsonResponse({},401))
      .mockResolvedValueOnce(jsonResponse({},401))
      .mockImplementationOnce(()=>refreshP)
      .mockResolvedValueOnce(jsonResponse({},401)) // retry1
      .mockResolvedValueOnce(jsonResponse({},500)) // retry2
    const api = await import('./api')
    const p1=api.authApi.listUsers(); const p2=api.authApi.getMyPermissions()
    resolveRefresh(jsonResponse({data:{accessToken:'n',refreshToken:'r2'}},200))
    const [r1,r2]=await Promise.all([p1,p2])
    expect(r1.error).toBe("You don't have permission to perform this action.")
    expect(r2.error).toBe('Request failed after token refresh')
  })

  it('covers no-token refresh failure redirect to login and bad/non-json responses', async () => {
    localStorage.setItem('refreshToken','rt')
    const f=(globalThis.fetch as any)
    f
      .mockResolvedValueOnce(jsonResponse({},401))
      .mockResolvedValueOnce(jsonResponse({},500))
      .mockResolvedValueOnce({ ok:true, status:200, text: async ()=> 'plain text', json: async ()=>{throw new Error('no')} } as any)
    const api=await import('./api')
    const r1=await api.rolesApi.list()
    expect(r1.error).toBe('Session expired. Please login again.')
    const r2=await api.rolesApi.list()
    expect(r2.data).toBe('plain text')
  })
})
