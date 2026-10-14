// API layer — handles all HTTP calls to backend services.
// Each service (auth, people, churches, etc.) has its own base URL
// configured via environment variables (see .env).
// The `request` helper adds auth headers, handles token refresh,
// and returns { data, error } for every call.

import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_URL || API_BASE
const PROFILE_API_BASE = import.meta.env.VITE_PROFILE_API_URL || API_BASE
const CHURCH_API_BASE = import.meta.env.VITE_CHURCH_API_URL || API_BASE
const PEOPLE_API_BASE = import.meta.env.VITE_PEOPLE_API_URL || API_BASE
const CONTRIBUTION_API_BASE = import.meta.env.VITE_CONTRIBUTION_API_URL || API_BASE
const ANNOUNCEMENT_API_BASE = import.meta.env.VITE_ANNOUNCEMENT_API_URL || API_BASE
const MEDIA_API_BASE = import.meta.env.VITE_MEDIA_API_URL || API_BASE
const MESSAGING_API_BASE = import.meta.env.VITE_MESSAGING_API_URL || API_BASE
const NOTIFICATION_API_BASE = import.meta.env.VITE_NOTIFICATION_API_URL || API_BASE
const AUDIT_API_BASE = import.meta.env.VITE_AUDIT_API_URL || API_BASE
const DASHBOARD_API_BASE = import.meta.env.VITE_DASHBOARD_API_URL || API_BASE
const PAYMENT_API_BASE = import.meta.env.VITE_PAYMENT_API_URL || API_BASE
const WORKFLOW_API_BASE = import.meta.env.VITE_WORKFLOW_API_URL || API_BASE

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const body = await res.json()
    const authData = body?.data as { accessToken: string; refreshToken: string } | undefined
    if (!authData?.accessToken) return null
    localStorage.setItem('accessToken', authData.accessToken)
    localStorage.setItem('refreshToken', authData.refreshToken)
    return authData.accessToken
  } catch {
    return null
  }
}

function processRefreshQueue(token: string | null) {
  refreshQueue.forEach(({ resolve }) => resolve(token || ''))
  refreshQueue = []
}

/**
 * Performs an HTTP request against a backend service and normalises the result.
 *
 * Behaviour:
 * - Attaches the bearer access token from localStorage when present.
 * - Sets `Content-Type: application/json` unless the body is FormData.
 * - On 401 (excluding auth endpoints) it transparently attempts a token refresh,
 *   serialising concurrent callers through a refresh queue and retrying once.
 * - Normalises both success and failure paths to `ApiResponse<T>`, mapping HTTP
 *   status codes to human-readable messages and extracting the backend `data`
 *   envelope where present.
 *
 * @param endpoint - API path, e.g. `/api/v1/auth/login` (no trailing slash).
 * @param options  - standard fetch options.
 * @param baseUrl  - base URL of the target service (from env or the shared API_BASE).
 * @returns a promise resolving to `{ data }` on success or `{ error }` on failure.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE,
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('accessToken')
  const isMultiPart = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isMultiPart ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers })

    if (res.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/sign-in') && !endpoint.includes('/auth/sign-out')) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshAccessToken()
        isRefreshing = false
        processRefreshQueue(newToken)

        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`
          const retryRes = await fetch(`${baseUrl}${endpoint}`, { ...options, headers })
          if (retryRes.status === 204) return {}
          if (retryRes.ok) {
            const data = await retryRes.json()
            return { data }
          }
          if (retryRes.status === 401) {
            return { error: "You don't have permission to perform this action." }
          }
          return { error: 'Request failed after token refresh' }
        }

        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        const hadToken = !!token
        if (hadToken) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => { window.location.href = '/dashboard' }, 100)
        } else {
          window.location.href = '/login'
        }
        return { error: 'Session expired. Please login again.' }
      }

      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(async (newToken: unknown) => {
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetch(`${baseUrl}${endpoint}`, { ...options, headers })
        if (retryRes.status === 204) return {} as ApiResponse<T>
        if (retryRes.ok) {
          const data = await retryRes.json()
          return { data } as ApiResponse<T>
        }
        if (retryRes.status === 401) {
          return { error: "You don't have permission to perform this action." } as ApiResponse<T>
        }
        return { error: 'Request failed after token refresh' } as ApiResponse<T>
      })
    }

    if (res.status === 204) return {}

    const text = await res.text()
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
    if (!res.ok) {
      const serverMsg = (body as Record<string, unknown>)?.message as string || (body as Record<string, unknown>)?.error as string
      if (serverMsg) return { error: serverMsg }
      const statusMessages: Record<number, string> = {
        400: 'Invalid request. Please check your input.',
        401: 'Invalid username or password.',
        403: 'Access denied.',
        404: 'Service not available.',
        409: 'Conflict. The request could not be processed.',
        429: 'Too many requests. Please slow down.',
      }
      return { error: statusMessages[res.status] || `Request failed (${res.status})` }
    }
    return { data: (body as Record<string, unknown>)?.data as T ?? body as T }
  } catch {
    return { error: 'Network error. Please check your connection.' }
  }
}

// ─── Dashboard ───

export interface DashboardCounters {
  dailyMessage: string | null
  members: number
  contributions: number
  churches: number
  projects: number
  announcements: number
}

export const dashboardApi = {
  getCounters() {
    return request<DashboardCounters>('/api/v1/dashboard/counters', {}, DASHBOARD_API_BASE)
  },
}

// ─── Auth (identity-service) ───

export interface RegisterRequest {
  username: string
  password: string
  phoneNumber?: string
  baptismCardNumber?: string
  churchId?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface PasswordResetRequest {
  phoneNumber: string
}

export interface PasswordResetConfirmRequest {
  phoneNumber: string
  otp: string
  newPassword: string
}

export interface ProfileUpdateRequest {
  firstName: string
  lastName: string
  middleName?: string
  tel: string
  emailAddress?: string
}

export interface ProfileResponse {
  firstName?: string
  middleName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  username?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ManagedUser {
  id: string
  username: string
  roles: string[]
  status: string
  churchId: string
  permissions: string[]
}

/** Auth & user management endpoints (identity-service, `AUTH_API_BASE`). */
export const authApi = {
  register(data: RegisterRequest) {
    return request<{ message: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, AUTH_API_BASE)
  },

  login(data: LoginRequest) {
    return request<AuthResponse>('/api/v1/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }, AUTH_API_BASE)
  },

  refreshToken(data: RefreshTokenRequest) {
    return request<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    }, AUTH_API_BASE)
  },

  logout(data: { accessToken: string; refreshToken: string }) {
    return request('/api/v1/auth/sign-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }, AUTH_API_BASE)
  },

  requestPasswordReset(data: PasswordResetRequest) {
    return request<{ message: string; expiresIn: number }>(
      '/api/v1/auth/password-reset/request',
      { method: 'POST', body: JSON.stringify(data) },
      AUTH_API_BASE,
    )
  },

  confirmPasswordReset(data: PasswordResetConfirmRequest) {
    return request<{ message: string }>(
      '/api/v1/auth/password-reset/confirm',
      { method: 'POST', body: JSON.stringify(data) },
      AUTH_API_BASE,
    )
  },

  getRoles(userId: string) {
    return request(`/api/v1/users/${userId}/roles`, {}, AUTH_API_BASE)
  },
  assignRole(userId: string, roleId: string) {
    return request(`/api/v1/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roleId }) }, AUTH_API_BASE)
  },
  revokeRole(userId: string, roleId: string) {
    return request(`/api/v1/users/${userId}/roles/${roleId}`, { method: 'DELETE' }, AUTH_API_BASE)
  },

  listUsers() {
    return request<ManagedUser[]>('/api/v1/users', {}, AUTH_API_BASE)
  },

  changePassword(data: ChangePasswordRequest) {
    return request<{ message: string }>('/api/v1/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }, AUTH_API_BASE)
  },
}

// ─── Profile (profile-service) ───

/** Current-user profile endpoints (profile-service, `PROFILE_API_BASE`). */
export const profileApi = {
  getProfile() {
    return request<ProfileResponse>('/api/v1/profile', {}, PROFILE_API_BASE)
  },
  updateProfile(data: ProfileUpdateRequest) {
    return request<ProfileResponse>('/api/v1/profile', { method: 'POST', body: JSON.stringify(data) }, PROFILE_API_BASE)
  },
}

// ─── Roles (auth-service) ───

export interface Role {
  id?: string
  name: string
  description?: string
  permissions: string[]
}

/** Role CRUD endpoints (auth-service, `AUTH_API_BASE`). */
export const rolesApi = {
  list() {
    return request<Role[]>('/api/v1/roles', {}, AUTH_API_BASE)
  },
  create(data: Omit<Role, 'id'>) {
    return request<Role>('/api/v1/roles', { method: 'POST', body: JSON.stringify(data) }, AUTH_API_BASE)
  },
  update(id: string, data: Omit<Role, 'id'>) {
    return request<Role>(`/api/v1/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }, AUTH_API_BASE)
  },
  delete(id: string) {
    return request(`/api/v1/roles/${id}`, { method: 'DELETE' }, AUTH_API_BASE)
  },
}

// ─── System Config (auth-service) ───

export interface SystemConfig {
  churchName: string
  churchAddress: string
  defaultCurrency: string
  locale?: string
}

/** System configuration endpoints (auth-service, `AUTH_API_BASE`). */
export const configApi = {
  get() {
    return request<SystemConfig>('/api/v1/system/config', {}, AUTH_API_BASE)
  },
  update(data: SystemConfig) {
    return request<SystemConfig>('/api/v1/system/config', { method: 'PUT', body: JSON.stringify(data) }, AUTH_API_BASE)
  },
}

// ─── Churches (church-service) ───

export interface PositionHolder {
  id: number
  name: string
  position?: string
  phoneNumber?: string
  email?: string
}

export interface Church {
  id: number
  name: string
  address: string
  parentChurchId?: number | null
  parentChurch?: Church | null
  pastors?: PositionHolder[]
  elders?: PositionHolder[]
  deacons?: PositionHolder[]
}

export interface ChurchRequest {
  name: string
  address: string
  parentChurchId?: number | null
  pastors?: Omit<PositionHolder, 'position'>[]
  elders?: Omit<PositionHolder, 'position'>[]
  deacons?: Omit<PositionHolder, 'position'>[]
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  last: boolean
  first: boolean
  empty: boolean
}

/** Church & sub-church endpoints (church-service, `CHURCH_API_BASE`). */
export const churchApi = {
  list(page = 0, size = 10, search?: string, sort?: string) {
    const qs = new URLSearchParams({ page: String(page), size: String(size) })
    if (search) qs.set('search', search)
    if (sort) qs.set('sort', sort)
    return request<PageResponse<Church>>(`/api/v1/churches?${qs.toString()}`, {}, CHURCH_API_BASE)
  },
  get(id: number) {
    return request<Church>(`/api/v1/churches/${id}`, {}, CHURCH_API_BASE)
  },
  getSubChurches(id: number) {
    return request<Church[]>(`/api/v1/churches/sub-churches/${id}`, {}, CHURCH_API_BASE)
  },
  create(data: ChurchRequest) {
    return request<Church>('/api/v1/churches', { method: 'POST', body: JSON.stringify(data) }, CHURCH_API_BASE)
  },
  update(id: number, data: ChurchRequest) {
    return request<Church>(`/api/v1/churches/${id}`, { method: 'PUT', body: JSON.stringify(data) }, CHURCH_API_BASE)
  },
  delete(id: number) {
    return request(`/api/v1/churches/${id}`, { method: 'DELETE' }, CHURCH_API_BASE)
  },
}

// ─── People (people-service) ───

export interface BaptismRecordDTO {
  id?: number
  serialNumber?: number
  dateOfBaptism?: string
  worshipCenter?: string
  bibleVerse?: string
  baptizedBy?: string
  remark?: string
  address?: string
  imageUri?: string
}

export interface Person {
  id: number
  tel?: string
  firstName: string
  middleName?: string
  lastName: string
  gender: string
  emailAddress?: string
  isBaptised: boolean
  baptised?: boolean
  baptismRecord?: BaptismRecordDTO
  church?: Church
  position?: string
  pastorRoleId?: number
  dateOfBirth?: string
  address?: string
  profilePhotoUrl?: string
  userId?: string
  email?: string
  phoneNumber?: string
  admin?: boolean
}

/** Member/person endpoints (people-service, `PEOPLE_API_BASE`). */
export const peopleApi = {
  list(params?: { churchId?: string; search?: string; position?: string; page?: number; size?: number; sort?: string; baptised?: string }) {
    const qs = new URLSearchParams()
    if (params?.churchId) {
      return request<PageResponse<Person>>(`/api/v1/members/church-members/${params.churchId}`, {}, PEOPLE_API_BASE)
    }
    if (params?.page !== undefined) qs.set('page', params.page.toString())
    if (params?.size !== undefined) qs.set('size', params.size.toString())
    if (params?.search) qs.set('search', params.search)
    if (params?.position) qs.set('position', params.position)
    if (params?.sort) qs.set('sort', params.sort)
    if (params?.baptised) qs.set('baptised', params.baptised)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request<PageResponse<Person>>(`/api/v1/members${query}`, {}, PEOPLE_API_BASE)
  },
  search(query: string, page?: number, size?: number) {
    const qs = new URLSearchParams()
    qs.set('query', query)
    if (page !== undefined) qs.set('page', page.toString())
    if (size !== undefined) qs.set('size', size.toString())
    return request<PageResponse<Person>>(`/api/v1/members/search?${qs.toString()}`, {}, PEOPLE_API_BASE)
  },
  get(id: string) {
    return request<Person>(`/api/v1/members/${id}`, {}, PEOPLE_API_BASE)
  },
  create(data: Partial<Person>) {
    return request<Person>('/api/v1/members', { method: 'POST', body: JSON.stringify(data) }, PEOPLE_API_BASE)
  },
  update(id: string, data: Partial<Person>) {
    return request<Person>(`/api/v1/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }, PEOPLE_API_BASE)
  },
  delete(id: string) {
    return request(`/api/v1/members/${id}`, { method: 'DELETE' }, PEOPLE_API_BASE)
  },
  makeChurchAdmin(id: string) {
    return request<boolean>(`/api/v1/church-admin/${id}`, { method: 'PUT' }, PEOPLE_API_BASE)
  },
  hasChurchAdmin(churchId: number) {
    return request<boolean>(`/api/v1/church-admin/${churchId}`, {}, PEOPLE_API_BASE)
  },
}

// ─── Backend DTO types ───

interface PastorResponse {
  id: number
  firstName: string
  middleName?: string
  lastName: string
  emailAddress?: string
  tel?: string
  gender?: string
  pastorRole?: { id: number; name: string } | null
  church?: { id: number; name: string } | null
}

interface ElderResponse {
  id: number
  firstName: string
  middleName?: string
  lastName: string
  emailAddress?: string
  tel?: string
  gender?: string
  pastorRole?: { id: number; name: string } | null
  church?: { id: number; name: string } | null
}

interface DeaconResponse {
  id: number
  firstName: string
  middleName?: string
  lastName: string
  emailAddress?: string
  tel?: string
  gender?: string
  pastorRole?: { id: number; name: string } | null
  church?: { id: number; name: string } | null
}

interface SpringPage<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

function mapPastorToPerson(p: PastorResponse): Person {
  return {
    id: p.id,
    userId: '',
    firstName: p.firstName, middleName: p.middleName, lastName: p.lastName,
    dateOfBirth: '', address: '',
    gender: p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : (p.gender || ''),
    phoneNumber: p.tel || '', email: p.emailAddress,
    church: p.church ? { id: p.church.id, name: p.church.name, address: '' } : undefined,
    position: p.pastorRole?.name || '',
    pastorRoleId: p.pastorRole?.id,
    tel: p.tel || '',
    emailAddress: p.emailAddress,
    isBaptised: false,
  }
}

function mapElderToPerson(p: ElderResponse): Person {
  return {
    id: p.id,
    userId: '',
    firstName: p.firstName, middleName: p.middleName, lastName: p.lastName,
    dateOfBirth: '', address: '',
    gender: p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : (p.gender || ''),
    phoneNumber: p.tel || '', email: p.emailAddress,
    church: p.church ? { id: p.church.id, name: p.church.name, address: '' } : undefined,
    position: p.pastorRole?.name || '',
    pastorRoleId: p.pastorRole?.id,
    tel: p.tel || '',
    emailAddress: p.emailAddress,
    isBaptised: false,
  }
}

function mapDeaconToPerson(p: DeaconResponse): Person {
  return {
    id: p.id,
    userId: '',
    firstName: p.firstName, middleName: p.middleName, lastName: p.lastName,
    dateOfBirth: '', address: '',
    gender: p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : (p.gender || ''),
    phoneNumber: p.tel || '', email: p.emailAddress,
    church: p.church ? { id: p.church.id, name: p.church.name, address: '' } : undefined,
    position: p.pastorRole?.name || '',
    pastorRoleId: p.pastorRole?.id,
    tel: p.tel || '',
    emailAddress: p.emailAddress,
    isBaptised: false,
  }
}

function toPersonRequest(data: Partial<Person> & { pastorRoleId?: number }): Record<string, unknown> {
  return {
    firstName: data.firstName, lastName: data.lastName, middleName: data.middleName,
    emailAddress: data.email || data.emailAddress,
    pastorRoleId: data.pastorRoleId ?? undefined,
    tel: data.phoneNumber || data.tel,
    churchId: data.church?.id ? Number(data.church.id) : null,
    gender: data.gender === 'Male' ? 'M' : data.gender === 'Female' ? 'F' : data.gender || undefined,
  }
}

function toPastorRequest(data: { memberId: number; pastorRoleId: number; churchId: number }): Record<string, unknown> {
  return { memberId: data.memberId, pastorRoleId: data.pastorRoleId, churchId: data.churchId }
}

// ─── Pastors ───

/** Pastor endpoints (pastor-service, `PEOPLE_API_BASE`). */
export const pastorsApi = {
  async list(page = 0, size = 100) { const res = await request<SpringPage<PastorResponse>>(`/api/v1/pastors?page=${page}&size=${size}`, {}, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: (res.data?.content || []).map(mapPastorToPerson) } },
  async get(id: string) { const res = await request<PastorResponse>(`/api/v1/pastors/${id}`, {}, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: res.data ? mapPastorToPerson(res.data) : undefined } },
  async create(data: { memberId: number; pastorRoleId: number; churchId: number }) { const body = JSON.stringify(toPastorRequest(data)); const res = await request<PastorResponse>('/api/v1/pastors', { method: 'POST', body }, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: res.data ? mapPastorToPerson(res.data) : undefined } },
  async update(id: string, data: { memberId: number; pastorRoleId: number; churchId: number }) { const body = JSON.stringify(toPastorRequest(data)); const res = await request<PastorResponse>(`/api/v1/pastors/${id}`, { method: 'PUT', body }, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: res.data ? mapPastorToPerson(res.data) : undefined } },
  async delete(id: string) { return request(`/api/v1/pastors/${id}`, { method: 'DELETE' }, CHURCH_API_BASE) },
}

// ─── Elders ───

/** Elder endpoints (elder-service, `PEOPLE_API_BASE`). */
export const eldersApi = {
  async list() {
    const res = await request<SpringPage<ElderResponse>>('/api/v1/elders', {}, CHURCH_API_BASE)
    return res.error ? { error: res.error } : { data: (res.data?.content || []).map(mapElderToPerson) }
  },
  async get(id: string) {
    const res = await request<ElderResponse>(`/api/v1/elders/${id}`, {}, CHURCH_API_BASE)
    return res.error ? { error: res.error } : { data: res.data ? mapElderToPerson(res.data) : undefined }
  },
  async create(data: { memberId: number }) {
    const body = JSON.stringify({ memberId: data.memberId })
    const res = await request<ElderResponse>('/api/v1/elders', { method: 'POST', body }, CHURCH_API_BASE)
    return res.error ? { error: res.error } : { data: res.data ? mapElderToPerson(res.data) : undefined }
  },
  async update(id: string, data: Partial<Person>) {
    const body = JSON.stringify(toPersonRequest(data))
    const res = await request<ElderResponse>(`/api/v1/elders/${id}`, { method: 'PUT', body }, CHURCH_API_BASE)
    return res.error ? { error: res.error } : { data: res.data ? mapElderToPerson(res.data) : undefined }
  },
  async delete(id: string) {
    return request(`/api/v1/elders/${id}`, { method: 'DELETE' }, CHURCH_API_BASE)
  },
}

// ─── Deacons ───

/** Deacon endpoints (deacon-service, `PEOPLE_API_BASE`). */
export const deaconsApi = {
  async list() { const res = await request<SpringPage<DeaconResponse>>('/api/v1/deacons', {}, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: (res.data?.content || []).map(mapDeaconToPerson) } },
  async get(id: string) { const res = await request<DeaconResponse>(`/api/v1/deacons/${id}`, {}, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: res.data ? mapDeaconToPerson(res.data) : undefined } },
  async create(data: { memberId: number }) { const body = JSON.stringify({ memberId: data.memberId }); const res = await request<DeaconResponse>('/api/v1/deacons', { method: 'POST', body }, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: res.data ? mapDeaconToPerson(res.data) : undefined } },
  async update(id: string, data: Partial<Person>) { const body = JSON.stringify(toPersonRequest(data)); const res = await request<DeaconResponse>(`/api/v1/deacons/${id}`, { method: 'PUT', body }, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: res.data ? mapDeaconToPerson(res.data) : undefined } },
  async delete(id: string) { return request(`/api/v1/deacons/${id}`, { method: 'DELETE' }, CHURCH_API_BASE) },
  search(query: string, page?: number, size?: number) {
    const qs = new URLSearchParams()
    qs.set('query', query)
    if (page !== undefined) qs.set('page', page.toString())
    if (size !== undefined) qs.set('size', size.toString())
    return request<SpringPage<DeaconResponse>>(`/api/v1/deacons/search?${qs.toString()}`, {}, CHURCH_API_BASE)
  },
}

// ─── Pastor Roles ───

interface PastorRole {
  id: number
  name: string
}

/** Pastor role lookup endpoints (`PEOPLE_API_BASE`). */
export const pastorRolesApi = {
  async list() { const res = await request<SpringPage<PastorRole>>('/api/v1/pastor-roles', {}, CHURCH_API_BASE); return res.error ? { error: res.error } : { data: res.data?.content || [] } },
  get(id: number) { return request<PastorRole>(`/api/v1/pastor-roles/${id}`, {}, CHURCH_API_BASE) },
}

// ─── Contributions (contribution-service) ───

/** Contribution endpoints (contribution-service, `CONTRIBUTION_API_BASE`). */
export const contributionApi = {
  listRequests(params?: { churchId?: string }) {
    const query = params?.churchId ? `?churchId=${params.churchId}` : ''
    return request(`/api/v1/contribution-requests${query}`, {}, CONTRIBUTION_API_BASE)
  },
  getRequest(id: string) {
    return request(`/api/v1/contribution-requests/${id}`, {}, CONTRIBUTION_API_BASE)
  },
  createRequest(data: Record<string, unknown>) {
    return request('/api/v1/contribution-requests', { method: 'POST', body: JSON.stringify(data) }, CONTRIBUTION_API_BASE)
  },
  listContributions(params?: { churchId?: string }) {
    const query = params?.churchId ? `?churchId=${params.churchId}` : ''
    return request(`/api/v1/contributions${query}`, {}, CONTRIBUTION_API_BASE)
  },
  recordContribution(data: Record<string, unknown>) {
    return request('/api/v1/contributions', { method: 'POST', body: JSON.stringify(data) }, CONTRIBUTION_API_BASE)
  },
}

// ─── Announcements (announcement-service) ───

/** Announcement & event endpoints (announcement-service, `ANNOUNCEMENT_API_BASE`). */
export const announcementApi = {
  list() {
    return request<SpringPage<Record<string, unknown>>>('/api/v1/announcements', {}, ANNOUNCEMENT_API_BASE)
      .then((res) => res.error ? { error: res.error } : { data: res.data?.content || [] })
  },
  get(id: string) {
    return request(`/api/v1/announcements/${id}`, {}, ANNOUNCEMENT_API_BASE)
  },
  create(data: Record<string, unknown>) {
    return request('/api/v1/announcements', { method: 'POST', body: JSON.stringify(data) }, ANNOUNCEMENT_API_BASE)
  },
  update(id: string, data: Record<string, unknown>) {
    return request(`/api/v1/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }, ANNOUNCEMENT_API_BASE)
  },
  delete(id: string) {
    return request(`/api/v1/announcements/${id}`, { method: 'DELETE' }, ANNOUNCEMENT_API_BASE)
  },
  acknowledge(id: string) {
    return request(`/api/v1/announcements/${id}/acknowledgments`, { method: 'POST' }, ANNOUNCEMENT_API_BASE)
  },
  listEvents() {
    return request('/api/v1/events', {}, ANNOUNCEMENT_API_BASE)
  },
  createEvent(data: Record<string, unknown>) {
    return request('/api/v1/events', { method: 'POST', body: JSON.stringify(data) }, ANNOUNCEMENT_API_BASE)
  },
  updateEvent(id: string, data: Record<string, unknown>) {
    return request(`/api/v1/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }, ANNOUNCEMENT_API_BASE)
  },
  deleteEvent(id: string) {
    return request(`/api/v1/events/${id}`, { method: 'DELETE' }, ANNOUNCEMENT_API_BASE)
  },
}

// ─── Media (media-service) ───

/** Media upload endpoints (media-service, `MEDIA_API_BASE`). */
export const mediaApi = {
  listSermons() {
    return request('/api/v1/sermons', {}, MEDIA_API_BASE)
  },
  getSermon(id: string) {
    return request(`/api/v1/sermons/${id}`, {}, MEDIA_API_BASE)
  },
  createSermon(data: Record<string, unknown>) {
    return request('/api/v1/sermons', { method: 'POST', body: JSON.stringify(data) }, MEDIA_API_BASE)
  },
  publishSermon(id: string) {
    return request(`/api/v1/sermons/${id}/publish`, { method: 'POST' }, MEDIA_API_BASE)
  },
  listMediaAssets() {
    return request('/api/v1/media-assets', {}, MEDIA_API_BASE)
  },
  uploadMediaAsset(data: Record<string, unknown>) {
    return request('/api/v1/media-assets', { method: 'POST', body: JSON.stringify(data) }, MEDIA_API_BASE)
  },
}

// ─── Messaging (messaging-service) ───

/** Messaging endpoints (messaging-service, `MESSAGING_API_BASE`). */
export const messagingApi = {
  listConversations(userId: string) {
    return request(`/api/v1/users/${userId}/conversations`, {}, MESSAGING_API_BASE)
  },
  getMessages(conversationId: string) {
    return request(`/api/v1/conversations/${conversationId}/messages`, {}, MESSAGING_API_BASE)
  },
  sendMessage(conversationId: string, data: Record<string, unknown>) {
    return request(`/api/v1/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(data) }, MESSAGING_API_BASE)
  },
  createConversation(data: Record<string, unknown>) {
    return request('/api/v1/conversations', { method: 'POST', body: JSON.stringify(data) }, MESSAGING_API_BASE)
  },
}

// ─── Notifications (notification-service) ───

/** Notification template endpoints (notification-service, `NOTIFICATION_API_BASE`). */
export const notificationApi = {
  listTemplates() {
    return request('/api/v1/notifications/templates', {}, NOTIFICATION_API_BASE)
  },
}

// ─── Audit (audit-service) ───

export const auditApi = {
  listEvents() {
    return request('/api/v1/audit-events', {}, AUDIT_API_BASE)
  },
}

// ─── Payments (payment-service) ───

export const paymentApi = {
  initialize(data: Record<string, unknown>) {
    return request('/api/v1/payments/initialize', { method: 'POST', body: JSON.stringify(data) }, PAYMENT_API_BASE)
  },
  getStatus(reference: string) {
    return request(`/api/v1/payments/${reference}`, {}, PAYMENT_API_BASE)
  },
}

// ─── Workflow (workflow-service) ───

export const workflowApi = {
  getPendingTasks() {
    return request('/api/v1/workflows/tasks/my-pending', {}, WORKFLOW_API_BASE)
  },
  startWorkflow(data: Record<string, unknown>) {
    return request('/api/v1/workflows/start', { method: 'POST', body: JSON.stringify(data) }, WORKFLOW_API_BASE)
  },
  takeAction(stepId: string, data: Record<string, unknown>) {
    return request(`/api/v1/workflows/steps/${stepId}/action`, { method: 'POST', body: JSON.stringify(data) }, WORKFLOW_API_BASE)
  },
}
