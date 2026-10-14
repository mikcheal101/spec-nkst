import { useState, useMemo, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { useAuth } from '../context/AuthContext'
import { useRolesList, useUpdateRole, useDeleteRole } from '../hooks/useRoles'
import { useUsers, useRegister, useAssignRole } from '../hooks/useAuth'
import { useConfig, useUpdateConfig } from '../hooks/useConfig'
import type { SystemConfig } from '../services/api'
import Skeleton from '../shared/components/Skeleton'

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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'config'>('roles')

  const allPerms = (user?.permissions ?? []).map((p) => String(p).toLowerCase())
  const canManageUsers = allPerms.some((p) => p.includes('_users'))
  const canManageConfig = allPerms.some((p) => p.includes('_config'))

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
      </div>

      <div className="tab-content">
        {activeTab === 'roles' && <RolesPanel />}
        {activeTab === 'users' && canManageUsers && <UsersPanel />}
        {activeTab === 'config' && canManageConfig && <ConfigPanel />}
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

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  CHURCH_ADMIN: 'Church Admin',
  PASTOR: 'Pastor',
  ELDER: 'Elder',
  DEACON: 'Deacon',
  TREASURER: 'Treasurer',
  MEMBER_BAPTISED: 'Member (Baptised)',
  MEMBER_UNBAPTISED: 'Member (Unbaptised)',
}

/* ─── Users Panel ─── */

function UsersPanel() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const churchId = currentUser?.churchId ?? ''
  const { data: users = [], isLoading, error: queryError } = useUsers()
  const registerMut = useRegister()
  const assignRoleMut = useAssignRole()

  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editRoles, setEditRoles] = useState<string[]>([])
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRoles, setNewRoles] = useState<string[]>(['MEMBER'])

  function openEditPermissions(u: any) {
    setEditingUser(u)
    setEditRoles([...u.roles])
    setEditPerms(toPermNames(u.permissions))
  }

  function toggleEditPerm(perm: string) {
    setEditPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm])
  }

  function toggleEditRole(role: string) {
    setEditRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role])
  }

  async function savePermissions() {
    if (!editingUser) return
    try {
      for (const role of editRoles) {
        await assignRoleMut.mutateAsync({ userId: editingUser.id, roleId: role })
      }
      showSuccessToast(t('churchUsers.userUpdated'))
      setEditingUser(null)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handleAddUser(e: FormEvent) {
    e.preventDefault()
    if (!newUsername.trim()) return
    try {
      const result = await registerMut.mutateAsync({ username: newUsername.trim(), password: newPassword, phoneNumber: newPhone || undefined, churchId: churchId || undefined } as any)
      for (const role of newRoles) {
        if (result) {
          await assignRoleMut.mutateAsync({ userId: '', roleId: role })
        }
      }
      showSuccessToast('User created')
      setShowAdd(false)
      setNewUsername('')
      setNewPassword('')
      setNewPhone('')
      setNewRoles(['MEMBER'])
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Create failed')
    }
  }

  const churchUsers = churchId ? users.filter((u: any) => u.churchId === churchId) : users

  if (isLoading) return <Skeleton.Card rows={3} />

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <p className="settings-panel-desc">{t('churchUsers.title')}{churchId ? ` — ${churchId}` : ''}</p>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>{t('settings.addUser')}</button>
      </div>

      {queryError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{queryError instanceof Error ? queryError.message : 'Error loading users'}</div>}

      <div className="settings-table-wrap">
        <table className="settings-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Status</th>
              <th className="settings-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {churchUsers.length === 0 && (
              <tr><td colSpan={4} className="text-center" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>{t('churchUsers.noUsers')}</td></tr>
            )}
            {churchUsers.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div className="settings-user-cell">
                    <span className="settings-user-avatar">{u.username?.charAt(0).toUpperCase()}</span>
                    <span>{u.username}</span>
                  </div>
                </td>
                <td>{u.roles.map((r: string) => roleLabels[r] || r).join(', ')}</td>
                <td><span className={`settings-status ${u.status === 'active' ? 'is-active' : 'is-inactive'}`}>{t(`common.${u.status}`)}</span></td>
                <td className="settings-td-actions">
                  <button className="btn btn-sm btn-outline" onClick={() => openEditPermissions(u)}>Edit Permissions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="dialog-overlay" onClick={() => setEditingUser(null)}>
          <div className="dialog dialog-lg" onClick={(e) => e.stopPropagation()}>
            <h3>{t('churchUsers.editUserPermissions', { username: editingUser.username })}</h3>
            <div className="dialog-form">
              <div className="form-group">
                <label>Roles</label>
                <div className="perm-section-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <label key={key} className="perm-toggle">
                      <input type="checkbox" checked={editRoles.includes(key)} onChange={() => toggleEditRole(key)} />
                      <span className="perm-toggle-track" />
                      <span className="perm-toggle-label">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div className="perm-scroll">
                  <PermissionToggles selected={editPerms} onToggle={toggleEditPerm} />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={savePermissions} disabled={assignRoleMut.isPending}>
                  {assignRoleMut.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="dialog-overlay" onClick={() => setShowAdd(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('settings.addUser')}</h3>
            <form onSubmit={handleAddUser} className="dialog-form">
              <div className="form-group">
                <label>{t('auth.username')} <span className="required">*</span></label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t('auth.password')} <span className="required">*</span></label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="form-group">
                <label>{t('auth.phoneNumber')}</label>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newRoles[0]} onChange={(e) => setNewRoles([e.target.value])}>
                  {Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={registerMut.isPending}>
                  {registerMut.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Config Panel ─── */

function ConfigPanel() {
  const { t } = useTranslation()
  const { data: configData, isLoading } = useConfig()
  const updateMut = useUpdateConfig()
  const [form, setForm] = useState<SystemConfig>({ churchName: '', churchAddress: '', defaultCurrency: 'NGN' })
  const [dirty, setDirty] = useState(false)
  const [loaded, setLoaded] = useState(false)

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

  if (isLoading) return <Skeleton.Card rows={3} />

  return (
    <div className="settings-panel">
      <form onSubmit={handleSubmit} className="settings-config-form">
        <div className="form-group">
          <label>Church Name</label>
          <input value={form.churchName} onChange={(e) => { setForm({ ...form, churchName: e.target.value }); setDirty(true) }} />
        </div>
        <div className="form-group">
          <label>Church Address</label>
          <textarea value={form.churchAddress} onChange={(e) => { setForm({ ...form, churchAddress: e.target.value }); setDirty(true) }} rows={3} />
        </div>
        <div className="form-group">
          <label>Default Currency</label>
          <select value={form.defaultCurrency} onChange={(e) => { setForm({ ...form, defaultCurrency: e.target.value }); setDirty(true) }}>
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
          </select>
        </div>
        <div className="settings-config-bar">
          <button type="submit" className="btn btn-primary" disabled={updateMut.isPending || !dirty}>
            {updateMut.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          {!dirty && <span className="settings-config-hint">No changes to save</span>}
        </div>
      </form>
    </div>
  )
}
