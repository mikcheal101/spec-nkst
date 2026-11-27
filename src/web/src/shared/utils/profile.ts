import type { ProfileResponse, ProfileUpdateRequest } from '../../services/api'

export const PHONE_PATTERN = /^(?=.*(?:\d.*){7,15})[+()\-\s\d]{7,20}$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function trimToUndefined(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t ? t : undefined
}

export function normalizeProfileResponse(raw: unknown): ProfileResponse {
  const obj = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
  const data = (obj.data && typeof obj.data === 'object') ? obj.data as Record<string, unknown> : obj
  const profile = (data.profile && typeof data.profile === 'object') ? data.profile as Record<string, unknown> : data
  const pick = (...keys: string[]) => {
    for (const k of keys) { const v = profile[k]; if (typeof v === 'string') return v.trim() }
    return undefined
  }
  return {
    firstName: pick('firstName', 'first_name'),
    middleName: pick('middleName', 'middle_name'),
    lastName: pick('lastName', 'last_name'),
    email: pick('email', 'emailAddress', 'email_address'),
    phoneNumber: pick('phoneNumber', 'tel', 'phone_number'),
    username: pick('username', 'userName'),
  }
}

export function normalizeProfileUpdateRequest(form: ProfileUpdateRequest): ProfileUpdateRequest {
  return {
    firstName: (form.firstName || '').trim(),
    lastName: (form.lastName || '').trim(),
    middleName: trimToUndefined(form.middleName),
    emailAddress: trimToUndefined(form.emailAddress),
    tel: (form.tel || '').trim(),
  }
}

export function validateProfileUpdate(form: ProfileUpdateRequest): Record<string, string> {
  const errors: Record<string, string> = {}
  const firstName = (form.firstName || '').trim()
  const lastName = (form.lastName || '').trim()
  const tel = (form.tel || '').trim()
  const email = (form.emailAddress || '').trim()
  if (!firstName) errors.firstName = 'First name is required'
  if (!lastName) errors.lastName = 'Last name is required'
  if (!tel) errors.tel = 'Phone number is required'
  else if (!PHONE_PATTERN.test(tel)) errors.tel = 'Phone number format is invalid'
  if (email && !EMAIL_PATTERN.test(email)) errors.emailAddress = 'Email format is invalid'
  return errors
}
