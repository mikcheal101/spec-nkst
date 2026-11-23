import { describe, expect, it } from 'vitest'
import { hasAnyPermission, hasPermission, normalizePermission, normalizePermissions } from './permissions'

describe('permissions utils', () => {
  it('normalizes legacy aliases to RESOURCE:ACTION', () => {
    expect(normalizePermission('CAN_READ_MEMBERS')).toBe('MEMBERS:READ')
    expect(normalizePermission('can_update_church')).toBe('CHURCHES:UPDATE')
    expect(normalizePermission('CAN_MANAGE_USERS')).toBe('USERS:UPDATE')
  })

  it('normalizes object and canonical forms', () => {
    expect(normalizePermission({ key: 'ROLES:UPDATE' })).toBe('ROLES:UPDATE')
    expect(normalizePermission({ resource: 'settings', action: 'read' })).toBe('SETTINGS:READ')
    expect(normalizePermission({ legacyAlias: 'CAN_READ_ANNOUNCEMENTS' })).toBe('ANNOUNCEMENTS:READ')
  })

  it('dedupes normalized permissions', () => {
    expect(normalizePermissions(['CAN_READ_MEMBERS', 'MEMBERS:READ', 'members:read'])).toEqual(['MEMBERS:READ'])
  })

  it('checks required permissions using canonical RESOURCE:ACTION', () => {
    const perms = ['CAN_READ_MEMBERS', 'USERS:UPDATE']
    expect(hasPermission(perms, 'MEMBERS:READ')).toBe(true)
    expect(hasPermission(perms, ['MEMBERS:READ', 'USERS:UPDATE'])).toBe(true)
    expect(hasPermission(perms, 'MEMBERS:DELETE')).toBe(false)
  })

  it('checks any permission', () => {
    expect(hasAnyPermission(['ROLES:READ'], ['USERS:READ', 'ROLES:READ'])).toBe(true)
    expect(hasAnyPermission(['ROLES:READ'], ['USERS:READ', 'SETTINGS:READ'])).toBe(false)
  })
})
