export type PermissionInput = string | { name?: string; key?: string; legacyAlias?: string; resource?: string; action?: string }

const LEGACY_MAP: Record<string, string> = {
  CAN_VIEW_ANNOUNCEMENTS: 'ANNOUNCEMENTS:READ',
  CAN_READ_ANNOUNCEMENTS: 'ANNOUNCEMENTS:READ',
  CAN_CREATE_ANNOUNCEMENTS: 'ANNOUNCEMENTS:CREATE',
  CAN_UPDATE_ANNOUNCEMENTS: 'ANNOUNCEMENTS:UPDATE',
  CAN_DELETE_ANNOUNCEMENTS: 'ANNOUNCEMENTS:DELETE',
  CAN_READ_MEMBERS: 'MEMBERS:READ',
  CAN_CREATE_MEMBERS: 'MEMBERS:CREATE',
  CAN_UPDATE_MEMBERS: 'MEMBERS:UPDATE',
  CAN_DELETE_MEMBERS: 'MEMBERS:DELETE',
  CAN_READ_CHURCH: 'CHURCHES:READ',
  CAN_CREATE_CHURCH: 'CHURCHES:CREATE',
  CAN_UPDATE_CHURCH: 'CHURCHES:UPDATE',
  CAN_DELETE_CHURCH: 'CHURCHES:DELETE',
  CAN_READ_SETTINGS: 'SETTINGS:READ',
  CAN_UPDATE_SETTINGS: 'SETTINGS:UPDATE',
  CAN_READ_ROLES: 'ROLES:READ',
  CAN_CREATE_ROLES: 'ROLES:CREATE',
  CAN_UPDATE_ROLES: 'ROLES:UPDATE',
  CAN_DELETE_ROLES: 'ROLES:DELETE',
  CAN_READ_USERS: 'USERS:READ',
  CAN_CREATE_USERS: 'USERS:CREATE',
  CAN_UPDATE_USERS: 'USERS:UPDATE',
  CAN_DELETE_USERS: 'USERS:DELETE',
  CAN_MANAGE_USERS: 'USERS:UPDATE',
}

export function normalizePermission(p: PermissionInput | null | undefined): string | null {
  if (!p) return null
  if (typeof p === 'string') {
    const raw = p.trim()
    if (!raw) return null
    const upper = raw.toUpperCase()
    if (LEGACY_MAP[upper]) return LEGACY_MAP[upper]
    if (upper.includes(':')) return upper
    return upper
  }
  const obj = p as any
  const key = obj.key || obj.name
  if (key) return normalizePermission(String(key))
  if (obj.resource && obj.action) return `${String(obj.resource).toUpperCase()}:${String(obj.action).toUpperCase()}`
  if (obj.legacyAlias) return normalizePermission(String(obj.legacyAlias))
  return null
}

export function normalizePermissions(perms: PermissionInput[] | null | undefined): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const p of perms || []) {
    const n = normalizePermission(p)
    if (n && !seen.has(n)) { seen.add(n); out.push(n) }
  }
  return out
}

export function hasPermission(userPerms: PermissionInput[] | null | undefined, required: string | string[]): boolean {
  const reqs = Array.isArray(required) ? required : [required]
  if (reqs.length === 0) return true
  const normalized = new Set(normalizePermissions(userPerms))
  return reqs.every((r) => {
    const n = normalizePermission(r)
    return n ? normalized.has(n) : false
  })
}

export function hasAnyPermission(userPerms: PermissionInput[] | null | undefined, required: string[]): boolean {
  if (!required.length) return true
  const normalized = new Set(normalizePermissions(userPerms))
  return required.some((r) => {
    const n = normalizePermission(r)
    return n ? normalized.has(n) : false
  })
}
