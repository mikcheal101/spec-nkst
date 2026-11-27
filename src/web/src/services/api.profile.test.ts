import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizeProfileResponse, profileApi } from './api'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem('accessToken', 'tok')
})

describe('normalizeProfileResponse', () => {
  it('unwraps nested envelope and maps alternate keys', () => {
    const r = normalizeProfileResponse({ data: { profile: { first_name: 'A', last_name: 'B', email_address: 'a@b.com', tel: '1234567', userName: 'u' } } })
    expect(r).toMatchObject({ firstName: 'A', lastName: 'B', email: 'a@b.com', phoneNumber: '1234567', username: 'u' })
  })
  it('handles empty payload', () => {
    expect(normalizeProfileResponse(undefined).firstName).toBeUndefined()
  })
})

describe('profileApi', () => {
  it('getProfile normalizes response', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ data: { firstName: 'A', lastName: 'B' } }) })
    const res = await profileApi.getProfile()
    expect(res.error).toBeUndefined()
    expect(res.data?.firstName).toBe('A')
  })

  it('updateProfile posts request and normalizes response', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ data: { firstName: 'Jane', lastName: 'Doe', tel: '1234567' } }) })
    const res = await profileApi.updateProfile({ firstName: 'Jane', lastName: 'Doe', middleName: '', emailAddress: '', tel: '1234567' })
    expect(res.error).toBeUndefined()
    expect(res.data?.firstName).toBe('Jane')
    expect(mockFetch.mock.calls[0][0]).toContain('/api/v1/profile')
  })

  it('surfaces standardized conflict error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 409, text: async () => JSON.stringify({ message: 'A profile with the provided contact information already exists.', code: 'PROFILE_CONTACT_CONFLICT' }) })
    const res = await profileApi.updateProfile({ firstName: 'A', lastName: 'B', tel: '1234567' })
    expect(res.error).toContain('contact information')
  })
})
