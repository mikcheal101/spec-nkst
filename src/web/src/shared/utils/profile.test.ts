import { describe, it, expect } from 'vitest'
import { normalizeProfileResponse, normalizeProfileUpdateRequest, validateProfileUpdate, trimToUndefined, PHONE_PATTERN, EMAIL_PATTERN } from './profile'

describe('profile utils', () => {
  it('normalizes profile response envelopes and aliases', () => {
    const p = normalizeProfileResponse({ data: { profile: { first_name: ' A ', last_name: ' B ', middle_name: ' M ', email_address: 'a@b.com ', tel: ' 1234567 ', username: 'u' } } })
    expect(p).toEqual({ firstName: 'A', lastName: 'B', middleName: 'M', email: 'a@b.com', phoneNumber: '1234567', username: 'u' })
  })

  it('handles empty/non-object/alternate envelope shapes', () => {
    expect(normalizeProfileResponse(null)).toEqual({ firstName: undefined, middleName: undefined, lastName: undefined, email: undefined, phoneNumber: undefined, username: undefined })
    expect(normalizeProfileResponse({ data: { firstName: 'X', lastName: 'Y' } }).firstName).toBe('X')
    expect(normalizeProfileResponse({ firstName: 'X' }).firstName).toBe('X')
    expect(normalizeProfileResponse({ data: 'x' as any }).firstName).toBeUndefined()
  })

  it('normalizes update request by trimming and omitting blank optional fields', () => {
    const p = normalizeProfileUpdateRequest({ firstName: ' A ', lastName: ' B ', middleName: ' ', emailAddress: ' ', tel: ' 1234567 ' })
    expect(p).toEqual({ firstName: 'A', lastName: 'B', middleName: undefined, emailAddress: undefined, tel: '1234567' })
    expect(normalizeProfileUpdateRequest({ firstName: undefined as any, lastName: undefined as any, tel: undefined as any }).firstName).toBe('')
  })

  it('validates required fields, phone pattern, length and optional email', () => {
    const errs = validateProfileUpdate({ firstName: '', lastName: '', tel: '' })
    expect(errs.firstName).toBeTruthy()
    expect(errs.lastName).toBeTruthy()
    expect(errs.tel).toBeTruthy()
    expect(validateProfileUpdate({ firstName: 'A', lastName: 'B', tel: '12' }).tel).toMatch(/invalid/i)
    expect(validateProfileUpdate({ firstName: 'A', lastName: 'B', tel: '123456789012345678901' }).tel).toMatch(/20 characters|invalid/i)
    expect(validateProfileUpdate({ firstName: 'A', lastName: 'B', tel: '1234567', emailAddress: 'bad' }).emailAddress).toMatch(/invalid/i)
    expect(validateProfileUpdate({ firstName: 'A', lastName: 'B', tel: '1234567', emailAddress: '' })).toEqual({})
    expect(validateProfileUpdate({ firstName: 'A', lastName: 'B', tel: '+1 (234) 567-8901', emailAddress: 'a@b.com' })).toEqual({})
  })

  it('exposes helpers and patterns', () => {
    expect(trimToUndefined('  ')).toBeUndefined()
    expect(trimToUndefined(' x ')).toBe('x')
    expect(trimToUndefined(1 as any)).toBeUndefined()
    expect(PHONE_PATTERN.test('1234567')).toBe(true)
    expect(EMAIL_PATTERN.test('a@b.com')).toBe(true)
  })
})
