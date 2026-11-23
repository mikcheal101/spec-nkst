import { useState, useMemo, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { useAuth } from '../context/AuthContext'
import { useRolesList, useUpdateRole, useDeleteRole } from '../hooks/useRoles'
import { useUsers, useRegister, useAssignRole, useRevokeRole, useSetUserStatus, useSetDirectPermissions } from '../hooks/useAuth'
import { useConfig, useUpdateConfig, useSystemConfigurations, useUpsertSystemConfiguration } from '../hooks/useConfig'
import type { SystemConfig } from '../services/api'
import { authApi, auditApi, type AuditLogEntry, type SystemConfigurationEntry } from '../services/api'
import Skeleton from '../shared/components/Skeleton'

type PermObj = { id?: number; name?: string; key?: string; legacyAlias?: string; resource?: string; action?: string }
type RoleLike = { id?: string | number; name: string; description?: string; permissions?: Array<string | PermObj>; displayName?: string; isSystem?: boolean; isProtected?: boolean; active?: boolean }

function toPermNames(perms: unknown): string[] {
  if (!Array.isArray(perms)) return []
  return perms.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
}

function permAction(name: string): string {
  return name.replace(/^CAN_/, '').split('_')[0]?.toLowerCase() || ''
}

const permActionColor: Record<string, string> = {
  create: 'var(--color-success)',
  read: 'var(--color-primary)',
  view: 'var(--color-accent)',
  update: '#2563eb',
  delete: 'var(--color-error)',
}

const permissionGroups: Record<string, string[]> = {
  Members: ['CAN_CREATE_MEMBERS', 'CAN_READ_MEMBERS', 'CAN_VIEW_MEMBERS', 'CAN_UPDATE_MEMBERS', 'CAN_DELETE_MEMBERS'],
  Pastors: ['CAN_CREATE_PASTORS', 'CAN_READ_PASTORS', 'CAN_VIEW_PASTORS', 'CAN_UPDATE_PASTORS', 'CAN_DELETE_PASTORS'],
  Elders: ['CAN_CREATE_ELDERS', 'CAN_READ_ELDERS', 'CAN_VIEW_ELDERS', 'CAN_UPDATE_ELDERS', 'CAN_DELETE_ELDERS'],
  Deacons: ['CAN_CREATE_DEACONS', 'CAN_READ_DEACONS', 'CAN_VIEW_DEACONS', 'CAN_UPDATE_DEACONS', 'CAN_DELETE_DEACONS'],
  Churches: ['CAN_CREATE_CHURCH', 'CAN_READ_CHURCH', 'CAN_VIEW_CHURCH', 'CAN_UPDATE_CHURCH', 'CAN_DELETE_CHURCH'],
  Announcements: ['CAN_CREATE_ANNOUNCEMENTS', 'CAN_READ_ANNOUNCEMENTS', 'CAN_VIEW_ANNOUNCEMENTS', 'CAN_UPDATE_ANNOUNCEMENTS', 'CAN_DELETE_ANNOUNCEMENTS'],
  Contributions: ['CAN_CREATE_CONTRIBUTION', 'CAN_READ_CONTRIBUTION', 'CAN_VIEW_CONTRIBUTION', 'CAN_UPDATE_CONTRIBUTION', 'CAN_DELETE_CONTRIBUTION'],
  Projects: ['CAN_CREATE_PROJECTS', 'CAN_READ_PROJECTS', 'CAN_VIEW_PROJECTS', 'CAN_UPDATE_PROJECTS', 'CAN_DELETE_PROJECTS'],
  Notifications: ['CAN_CREATE_NOTIFICATION', 'CAN_READ_NOTIFICATION', 'CAN_VIEW_NOTIFICATION', 'CAN_UPDATE_NOTIFICATION', 'CAN_DELETE_NOTIFICATION'],
  Settings: ['CAN_CREATE_SETTINGS', 'CAN_READ_SETTINGS', 'CAN_VIEW_SETTINGS', 'CAN_UPDATE_SETTINGS', 'CAN_DELETE_SETTINGS'],
  Roles: ['CAN_CREATE_ROLES', 'CAN_READ_ROLES', 'CAN_VIEW_ROLES', 'CAN_UPDATE_ROLES', 'CAN_DELETE_ROLES'],
  Permissions: ['CAN_CREATE_PERMISSIONS', 'CAN_READ_PERMISSIONS', 'CAN_VIEW_PERMISSIONS', 'CAN_UPDATE_PERMISSIONS', 'CAN_DELETE_PERMISSIONS'],
}

function PermissionToggles({ selected, onToggle }: { selected: string[]; onToggle: (perm: string) => void }) {
  const actions = ['create', 'read', 'view', 'update', 'delete']
  return (
    <div className="perm-table-wrap">
      <table className="perm-table">
        <thead>
          <tr>
            <th className="perm-th-resource">Permission</th>
            {actions.map((a) => (
              <th key={a} className="perm-th-action" style={{ color: permActionColor[a] }}>{a.charAt(0).toUpperCase() + a.slice(1)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(permissionGroups).map(([category, perms]) => (
            <tr key={category}>
              <td className="perm-td-resource">{category}</td>
              {perms.map((perm) => {
                const action = permAction(perm)
                return (
                  <td key={perm} className="perm-td-check">
                    <label className="perm-cell-toggle" data-checked={selected.includes(perm)} style={{ '--toggle-color': permActionColor[action] } as React.CSSProperties}>
                      <input type="checkbox" checked={selected.includes(perm)} onChange={() => onToggle(perm)} />
                      <span className="perm-cell-track" />
                    </label>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Settings() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'config' | 'audit'>('roles')

  const canManageUsers = hasPermission(['USERS:READ']) || hasPermission(['USERS:UPDATE']) || hasPermission(['ROLES:READ'])
  const canManageConfig = hasPermission(['SETTINGS:READ']) || hasPermission(['SETTINGS:UPDATE']) || hasPermission(['CONFIG:READ']) || hasPermission(['CONFIG:UPDATE'])
  const canViewAudit = hasPermission(['SETTINGS:READ']) || hasPermission(['ROLES:READ']) || hasPermission(['USERS:READ'])

  return (
    <div className="page page-settings">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t('settings.title')}</h2>
          <p className="page-subtitle">{t('settings.description')}</p>
        </div>
      </div>

      <div className="settings-tabs">
        <button className={`settings-tab ${activeTab === 'roles' ? 'is-active' : ''}`} onClick={() => setActiveTab('roles')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          {t('settings.roles')}
        </button>
        {canManageUsers && (
          <button className={`settings-tab ${activeTab === 'users' ? 'is-active' : ''}`} onClick={() => setActiveTab('users')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t('settings.manageUsers')}
          </button>
        )}
        {canManageConfig && (
          <button className={`settings-tab ${activeTab === 'config' ? 'is-active' : ''}`} onClick={() => setActiveTab('config')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {t('settings.systemConfig')}
          </button>
        )}

        {canViewAudit && (
          <button className={`settings-tab ${activeTab === 'audit' ? 'is-active' : ''}`} onClick={() => setActiveTab('audit')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Audit Logs
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'roles' && <RolesPanel />}
        {activeTab === 'users' && canManageUsers && <UsersPanel />}
        {activeTab === 'config' && canManageConfig && <ConfigPanel />}
        {activeTab === 'audit' && canViewAudit && <AuditLogPanel />}
      </div>
    </div>
  )
}

/* ─── Roles Panel ─── */

function RolesPanel() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: rawRoles = [], isLoading, error: queryError } = useRolesList()
  const updateMut = useUpdateRole()
  const deleteMut = useDeleteRole()

  const allPerms = (user?.permissions ?? []).map((p) => String(p).toLowerCase())
  const canReadRoles = allPerms.includes('can_read_roles')
  const canUpdateRoles = allPerms.includes('can_update_roles')
  const canDeleteRoles = allPerms.includes('can_delete_roles')

  const roles = useMemo(
    () => rawRoles.map((r: any) => ({ ...r, permissions: toPermNames(r.permissions) })),
    [rawRoles],
  )

  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const editingRole = useMemo(
    () => roles.find((r: any) => r.id === editingRoleId) || null,
    [roles, editingRoleId],
  )

  function togglePerm(perm: string) {
    setSelectedPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm])
  }

  function openEdit(role: any) {
    setEditingRoleId(role.id)
    setRoleName(role.name)
    setRoleDesc(role.description || '')
    setSelectedPerms(toPermNames(role.permissions))
  }

  function closeEdit() {
    setEditingRoleId(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!roleName.trim() || !editingRoleId) return
    const payload = { name: roleName.trim(), description: roleDesc.trim(), permissions: selectedPerms }
    try {
      await updateMut.mutateAsync({ id: String(editingRoleId), data: payload })
      showSuccessToast('Role updated')
      closeEdit()
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  async function handleDelete(role: any) {
    if (!role.id) return
    if (!window.confirm(t('common.confirm'))) return
    try {
      await deleteMut.mutateAsync(role.id)
      showSuccessToast('Role deleted')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (isLoading) return <Skeleton.Card rows={3} />

  if (!canReadRoles) {
    return (
      <div className="settings-panel">
        <div className="empty-state" style={{ padding: '3rem 0' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>You don't have permission to view roles.</p>
        </div>
      </div>
    )
  }

  if (editingRole) {
    return (
      <div className="settings-panel">
        <div className="settings-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-icon" onClick={closeEdit} title="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>{editingRole.name.replace(/_/g, ' ')}</h3>
              <p className="settings-panel-desc" style={{ margin: 0 }}>Edit role permissions</p>
            </div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={closeEdit}>Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="settings-edit-form">
          <div className="settings-edit-section">
            <div className="settings-edit-section-title">Details</div>
            <div className="settings-edit-fields">
              <div className="form-group">
                <label>Role Name <span className="required">*</span></label>
                <input value={roleName} disabled />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={roleDesc} disabled rows={2} placeholder="Optional description" />
              </div>
            </div>
          </div>

          <div className="settings-edit-section">
            <div className="settings-edit-section-title">Permissions</div>
            <div className="perm-scroll" style={{ maxHeight: '420px' }}>
              <PermissionToggles selected={selectedPerms} onToggle={togglePerm} />
            </div>
          </div>

          <div className="settings-edit-bar">
            <button type="submit" className="btn btn-primary" disabled={updateMut.isPending || !canUpdateRoles} title={!canUpdateRoles ? 'No permission to update roles' : ''}>
              {updateMut.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-outline" onClick={closeEdit}>Cancel</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="settings-panel">
      {queryError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{queryError instanceof Error ? queryError.message : 'Error loading roles'}</div>}

      {roles.length === 0 && <div className="empty-state">{t('common.noData')}</div>}

      <div className="settings-cards">
        {roles.map((role: any) => (
          <div key={role.id || role.name} className="settings-card">
            <div className="settings-card-head">
              <div>
                <h4 className="settings-card-name">{role.name.replace(/_/g, ' ')}</h4>
                {role.description && <p className="settings-card-desc">{role.description}</p>}
              </div>
              <div className="settings-card-actions">
                {canUpdateRoles && (
                  <button className="btn-icon" onClick={() => openEdit(role)} title="Edit">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                )}
                {canDeleteRoles && (
                  <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(role)} title="Delete">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                )}
                {!canUpdateRoles && !canDeleteRoles && (
                  <span className="settings-card-locked" title="No edit permissions">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                )}
              </div>
            </div>
            {(() => {
              const grouped: Record<string, string[]> = {}
              for (const p of role.permissions ?? []) {
                const name = typeof p === 'string' ? p : p?.name
                if (!name) continue
                const action = permAction(name)
                if (!grouped[action]) grouped[action] = []
                const resource = name.replace(/^CAN_\w+_/, '').replace(/_/g, ' ')
                grouped[action].push(resource)
              }
              const order = ['create', 'read', 'view', 'update', 'delete']
              return (
                <div className="role-perm-grid">
                  {order.map((action) => {
                    const resources = grouped[action]
                    if (!resources?.length) return null
                    return (
                      <div key={action} className="role-perm-col">
                        <div className="role-perm-col-head" style={{ color: permActionColor[action] || 'var(--color-text-secondary)' }}>
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </div>
                        <div className="role-perm-col-body">
                          {resources.map((r) => <span key={r} className="role-perm-item">{r}</span>)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}


/* ─── Users Panel ─── */

function UsersPanel() {
  const { t } = useTranslation()
  const { user: currentUser, hasPermission, refreshPermissions } = useAuth()
  const { data: users = [], isLoading, error: queryError } = useUsers()
  const { data: rawRoles = [] } = useRolesList()
  const { data: sysConfigs = [] } = useSystemConfigurations()
  const registerMut = useRegister()
  const assignRoleMut = useAssignRole()
  const revokeRoleMut = useRevokeRole()
  const setStatusMut = useSetUserStatus()
  const setDirectPermsMut = useSetDirectPermissions()
  const roles = useMemo(() => rawRoles as RoleLike[], [rawRoles])
  const directPermissionsPolicyEnabled = useMemo(() => {
    const entry = (sysConfigs as SystemConfigurationEntry[]).find((c) => String(c.configKey).toUpperCase() === 'GOVERNANCE_DIRECT_PERMISSIONS_ENABLED')
    return String(entry?.configValue ?? '').toLowerCase() === 'true'
  }, [sysConfigs])

  const canManageUsers = hasPermission(['USERS:UPDATE', 'ROLES:UPDATE', 'SETTINGS:UPDATE'])
  const [stepUpOpen, setStepUpOpen] = useState(false)
  const [stepUpLoading, setStepUpLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<null | ((stepUpToken: string) => Promise<void>)>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState('MEMBER')

  async function runStepUpConfirm(password: string) {
    if (!pendingAction) return
    setStepUpLoading(true)
    try {
      const res = await authApi.stepUp(password)
      if (!res.data?.stepUpToken) throw new Error(res.error || 'Step-up failed')
      await pendingAction(res.data.stepUpToken)
      setStepUpOpen(false)
      setPendingAction(null)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Step-up failed')
    } finally {
      setStepUpLoading(false)
    }
  }

  function queueStepUp(action: (stepUpToken: string) => Promise<void>) {
    setPendingAction(() => action)
    setStepUpOpen(true)
  }

  async function handleAddUser(e: FormEvent) {
    e.preventDefault()
    if (!newUsername.trim()) return
    try {
      const res = await registerMut.mutateAsync({ username: newUsername.trim(), password: newPassword, phoneNumber: newPhone || undefined, churchId: currentUser?.churchId || undefined } as any)
      const createdId = (res as any)?.id || (res as any)?.data?.id
      if (createdId && newRole) {
        try { await assignRoleMut.mutateAsync({ userId: String(createdId), roleId: newRole }) } catch { /* role can be assigned manually */ }
      }
      showSuccessToast('User created')
      setShowAdd(false)
      setNewUsername(''); setNewPassword(''); setNewPhone(''); setNewRole('MEMBER')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Create failed')
    }
  }

  async function handleAssign(u: any, role: string) {
    const needs = String(role).toUpperCase().includes('SUPER_ADMIN') || (u.roles || []).some((r: string) => String(r).toUpperCase().includes('SUPER_ADMIN'))
    const doAssign = async (stepUpToken?: string) => {
      await assignRoleMut.mutateAsync({ userId: String(u.id), roleId: role, stepUpToken })
      showSuccessToast('Role assigned')
      await refreshPermissions()
    }
    try {
      if (needs) queueStepUp(async (token) => { await doAssign(token) })
      else await doAssign()
    } catch (err) { showErrorToast(err instanceof Error ? err.message : 'Assign failed') }
  }

  async function handleRevoke(u: any, role: string) {
    const isProtectedTarget = String(role).toUpperCase().includes('SUPER_ADMIN') || (u.roles || []).some((r: string) => String(r).toUpperCase().includes('SUPER_ADMIN'))
    const doRevoke = async (stepUpToken?: string) => {
      await revokeRoleMut.mutateAsync({ userId: String(u.id), roleId: role, stepUpToken })
      showSuccessToast('Role revoked')
      await refreshPermissions()
    }
    try {
      if (isProtectedTarget) queueStepUp(async (token) => { await doRevoke(token) })
      else await doRevoke()
    } catch (err) { showErrorToast(err instanceof Error ? err.message : 'Revoke failed') }
  }

  async function handleStatus(u: any, status: string) {
    const isProtectedTarget = (u.roles || []).some((r: string) => String(r).toUpperCase().includes('SUPER_ADMIN'))
    const doSet = async (stepUpToken?: string) => {
      await setStatusMut.mutateAsync({ userId: String(u.id), status, stepUpToken })
      showSuccessToast(`User ${status.toLowerCase()}`)
    }
    try {
      if (isProtectedTarget) queueStepUp(async (token) => { await doSet(token) })
      else await doSet()
    } catch (err) { showErrorToast(err instanceof Error ? err.message : 'Status update failed') }
  }

  async function handleDirectPermissions(u: any) {
    const isRoot = Boolean(u.isRootSuperAdmin || u.rootSuperAdmin)
    if (isRoot) {
      showErrorToast('Root Super Admin direct permissions are immutable.')
      return
    }
    if (!canManageUsers) {
      showErrorToast('Access denied. Direct permission changes require governance permission and are audited.')
      return
    }
    if (!directPermissionsPolicyEnabled) {
      showErrorToast('Direct user-permission assignment is disabled by policy. Request was denied and audited.')
      return
    }
    const current = Array.isArray(u.permissions) ? u.permissions : []
    const nextRaw = window.prompt('Enter direct permissions as comma-separated canonical RESOURCE:ACTION keys', current.join(','))
    if (nextRaw === null) return
    const permissions = nextRaw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    const isProtectedTarget = (u.roles || []).some((r: string) => String(r).toUpperCase().includes('SUPER_ADMIN'))
    const doSet = async (stepUpToken?: string) => {
      await setDirectPermsMut.mutateAsync({ userId: String(u.id), permissions, policyEnabled: true, stepUpToken })
      showSuccessToast('Direct permissions updated. Change is audited.')
      await refreshPermissions()
    }
    try {
      if (isProtectedTarget) queueStepUp(async (token) => { await doSet(token) })
      else await doSet()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Direct permission update failed'
      showErrorToast(/policy|disabled|forbidden|403/i.test(msg) ? `Direct permission request denied/audited: ${msg}` : msg)
    }
  }

  if (isLoading) return <Skeleton.Card rows={3} />

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <p className="settings-panel-desc">{t('churchUsers.title')}</p>
        {canManageUsers && <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>{t('settings.addUser')}</button>}
      </div>

      {queryError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{queryError instanceof Error ? queryError.message : 'Error loading users'}</div>}

      <div className="settings-table-wrap">
        <table className="settings-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Status</th>
              <th className="settings-th-actions">Governance Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} className="text-center" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>{t('churchUsers.noUsers')}</td></tr>
            )}
            {users.map((u: any) => {
              const isSuperAdmin = (u.roles || []).some((r: string) => String(r).toUpperCase().includes('SUPER_ADMIN'))
              const isRoot = Boolean(u.isRootSuperAdmin || u.rootSuperAdmin)
              return (
                <tr key={u.id}>
                  <td>
                    <div className="settings-user-cell">
                      <span className="settings-user-avatar">{u.username?.charAt(0).toUpperCase()}</span>
                      <div>
                        <div>{u.username}</div>
                        {isSuperAdmin && <div style={{ fontSize: '0.72rem', color: 'var(--color-warning, #b45309)' }}>{isRoot ? 'Root Super Admin (immutable)' : 'Super Admin - safeguards apply'}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {(u.roles || []).map((r: string) => (
                        <span key={r} className="badge badge-secondary" style={{ display:'inline-flex', gap:'0.25rem', alignItems:'center' }}>
                          {r}
                          {canManageUsers && !isRoot && <button type="button" className="btn-icon" style={{ width:18,height:18 }} title={`Revoke ${r}`} onClick={() => handleRevoke(u, r)}>×</button>}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`settings-status ${String(u.status).toLowerCase() === 'active' ? 'is-active' : 'is-inactive'}`}>{u.status || 'ACTIVE'}</span></td>
                  <td className="settings-td-actions">
                    <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                      <select defaultValue="" onChange={(e) => { const v=e.target.value; if(v){ handleAssign(u,v); e.currentTarget.value=''} }} disabled={!canManageUsers || isRoot}>
                        <option value="">Assign role…</option>
                        {roles.map(r => <option key={String(r.id ?? r.name)} value={r.name}>{r.displayName || r.name}</option>)}
                      </select>
                      {String(u.status).toUpperCase() === 'ACTIVE' ? (
                        <button className="btn btn-sm btn-outline" disabled={!canManageUsers || isRoot} onClick={() => handleStatus(u, 'DISABLED')}>Disable</button>
                      ) : (
                        <button className="btn btn-sm btn-outline" disabled={!canManageUsers || isRoot} onClick={() => handleStatus(u, 'ACTIVE')}>Enable</button>
                      )}
                      <button
                        className="btn btn-sm btn-outline"
                        disabled={!canManageUsers || isRoot || setDirectPermsMut.isPending}
                        title={!directPermissionsPolicyEnabled ? 'Direct permissions disabled by policy; attempts are denied and audited.' : 'Set direct permissions (audited)'}
                        onClick={() => handleDirectPermissions(u)}
                      >
                        Direct Permissions
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="dialog-overlay" onClick={() => setShowAdd(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('settings.addUser')}</h3>
            <form onSubmit={handleAddUser} className="dialog-form">
              <div className="form-group"><label>{t('auth.username')} <span className="required">*</span></label><input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required /></div>
              <div className="form-group"><label>{t('auth.password')} <span className="required">*</span></label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} /></div>
              <div className="form-group"><label>{t('auth.phoneNumber')}</label><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
              <div className="form-group"><label>Role</label><select value={newRole} onChange={(e) => setNewRole(e.target.value)}>{roles.map(r => <option key={String(r.id ?? r.name)} value={r.name}>{r.displayName || r.name}</option>)}</select></div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={registerMut.isPending}>{registerMut.isPending ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StepUpModal open={stepUpOpen} loading={stepUpLoading} onClose={() => { setStepUpOpen(false); setPendingAction(null) }} onConfirm={runStepUpConfirm} />
    </div>
  )
}


function StepUpModal({ open, loading, onClose, onConfirm }: { open: boolean; loading: boolean; onClose: () => void; onConfirm: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  if (!open) return null
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Step-up Confirmation</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Confirm your password to continue this sensitive governance action.</p>
        <form onSubmit={async (e) => { e.preventDefault(); await onConfirm(password); setPassword('') }} className="dialog-form">
          <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required /></div>
          <div className="dialog-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !password}>{loading ? 'Confirming…' : 'Confirm'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
/* ─── Config Panel ─── */

function ConfigPanel() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const { data: configData, isLoading } = useConfig()
  const updateMut = useUpdateConfig()
  const { data: sysConfigs = [], isLoading: sysLoading, error: sysError } = useSystemConfigurations()
  const upsertMut = useUpsertSystemConfiguration()
  const [form, setForm] = useState<SystemConfig>({ churchName: '', churchAddress: '', defaultCurrency: 'NGN' })
  const [dirty, setDirty] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const canUpdate = hasPermission(['SETTINGS:UPDATE'])

  if (configData && !loaded) {
    setForm(configData)
    setLoaded(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateMut.mutate(form, {
      onSuccess: () => { showSuccessToast(t('common.success')); setDirty(false) },
      onError: (err) => showErrorToast(err instanceof Error ? err.message : 'Update failed'),
    })
  }

  async function handleUpsert(e: FormEvent) {
    e.preventDefault()
    if (!newKey.trim()) return
    try {
      await upsertMut.mutateAsync({ key: newKey.trim(), value: newValue, description: newDesc || undefined })
      showSuccessToast('Configuration saved')
      setNewKey(''); setNewValue(''); setNewDesc('')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Save failed')
    }
  }

  if (isLoading || sysLoading) return <Skeleton.Card rows={3} />

  return (
    <div className="settings-panel">
      <form onSubmit={handleSubmit} className="settings-config-form" style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Basic Configuration</h4>
        <div className="form-group"><label>Church Name</label><input value={form.churchName} onChange={(e) => { setForm({ ...form, churchName: e.target.value }); setDirty(true) }} /></div>
        <div className="form-group"><label>Church Address</label><textarea value={form.churchAddress} onChange={(e) => { setForm({ ...form, churchAddress: e.target.value }); setDirty(true) }} rows={3} /></div>
        <div className="form-group"><label>Default Currency</label>
          <select value={form.defaultCurrency} onChange={(e) => { setForm({ ...form, defaultCurrency: e.target.value }); setDirty(true) }}>
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
          </select>
        </div>
        <div className="settings-config-bar">
          <button type="submit" className="btn btn-primary" disabled={updateMut.isPending || !dirty || !canUpdate}>{updateMut.isPending ? 'Saving…' : 'Save Changes'}</button>
          {!dirty && <span className="settings-config-hint">No changes to save</span>}
        </div>
      </form>

      <div className="settings-config-form">
        <h4 style={{ marginBottom: '0.75rem' }}>System Configuration Entries</h4>
        {sysError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{sysError instanceof Error ? sysError.message : 'Failed to load configurations'}</div>}
        <div className="settings-table-wrap" style={{ marginBottom: '1rem' }}>
          <table className="settings-table">
            <thead><tr><th>Key</th><th>Value</th><th>Description</th><th>Updated</th></tr></thead>
            <tbody>
              {(sysConfigs as SystemConfigurationEntry[]).length === 0 && <tr><td colSpan={4} style={{ padding: '1rem', color:'var(--color-text-muted)' }}>No configuration entries</td></tr>}
              {(sysConfigs as SystemConfigurationEntry[]).map((c) => (
                <tr key={c.configKey}><td><code>{c.configKey}</code></td><td style={{ maxWidth:320, overflow:'hidden', textOverflow:'ellipsis' }}>{c.configValue}</td><td>{c.description || '—'}</td><td>{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {canUpdate && (
          <form onSubmit={handleUpsert} className="dialog-form">
            <div className="form-row">
              <div className="form-group"><label>Key</label><input value={newKey} onChange={(e)=>setNewKey(e.target.value)} required /></div>
              <div className="form-group"><label>Value</label><input value={newValue} onChange={(e)=>setNewValue(e.target.value)} required /></div>
            </div>
            <div className="form-group"><label>Description</label><input value={newDesc} onChange={(e)=>setNewDesc(e.target.value)} /></div>
            <button type="submit" className="btn btn-primary" disabled={upsertMut.isPending}>{upsertMut.isPending ? 'Saving…' : 'Save Configuration'}</button>
          </form>
        )}
      </div>
    </div>
  )
}

function AuditLogPanel() {
  const { hasPermission } = useAuth()
  const canRead = hasPermission(['SETTINGS:READ', 'ROLES:READ', 'SETTINGS:VIEW'])
  const [action, setAction] = useState('')
  const [actor, setActor] = useState('')
  const [correlationId, setCorrelationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<AuditLogEntry[]>([])

  async function load() {
    if (!canRead) return
    setLoading(true); setError('')
    try {
      const res = await auditApi.list({ page: 0, size: 50, action: action || undefined, actor: actor || undefined, correlationId: correlationId || undefined })
      if (res.error) throw new Error(res.error)
      const data = res.data as any
      setLogs(Array.isArray(data) ? data : (data?.content || []))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!canRead) return <div className="settings-panel"><p style={{ color: 'var(--color-text-muted)' }}>You don't have permission to view audit logs.</p></div>

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <p className="settings-panel-desc">Governance and security audit events (append-only).</p>
        <button className="btn btn-sm btn-outline" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      <div className="form-row" style={{ marginBottom: '1rem' }}>
        <div className="form-group"><label>Action</label><input value={action} onChange={e=>setAction(e.target.value)} placeholder="Filter action" /></div>
        <div className="form-group"><label>Actor</label><input value={actor} onChange={e=>setActor(e.target.value)} placeholder="Filter actor" /></div>
        <div className="form-group"><label>Correlation ID</label><input value={correlationId} onChange={e=>setCorrelationId(e.target.value)} placeholder="Filter correlation" /></div>
      </div>
      <div style={{ marginBottom:'1rem' }}><button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>Apply Filters</button></div>
      {error && <div className="alert alert-error" style={{ marginBottom:'1rem' }}>{error}</div>}
      <div className="settings-table-wrap">
        <table className="settings-table">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Resource</th><th>Outcome</th><th>Correlation</th></tr></thead>
          <tbody>
            {logs.length === 0 && !loading && <tr><td colSpan={6} style={{ padding:'1rem', color:'var(--color-text-muted)' }}>No audit logs found</td></tr>}
            {logs.map((l) => (
              <tr key={String(l.id)}>
                <td style={{ whiteSpace:'nowrap' }}>{l.occurredAt ? new Date(l.occurredAt).toLocaleString() : '—'}</td>
                <td>{l.actorUsername || l.actorUserId || '—'}</td>
                <td><code>{l.action}</code></td>
                <td>{l.resourceType}{l.resourceId ? `:${l.resourceId}` : ''}</td>
                <td><span className={`badge ${l.outcome==='SUCCESS'?'badge-success': l.outcome==='DENIED'?'badge-warning':'badge-danger'}`}>{l.outcome}</span></td>
                <td style={{ fontSize:'0.75rem', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis' }}>{l.correlationId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
