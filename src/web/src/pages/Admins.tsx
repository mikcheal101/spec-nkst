import { useState, useMemo, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { usePeopleList } from '../hooks/usePeople'
import { useUsers, useAssignRole, useRevokeRole, useRegister } from '../hooks/useAuth'
import { useAuth } from '../context/AuthContext'
import Skeleton from '../shared/components/Skeleton'

const ADMIN_ROLE = 'CHURCH_ADMIN'

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)
const IconUserPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)

export default function Admins() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const churchId = currentUser?.churchId

  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState<number | null>(null)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const { data: pageResponse, isLoading } = usePeopleList({
    search: query || undefined,
    size: 200,
  })
  const members = pageResponse?.content ?? []

  const { data: managedUsers = [], isLoading: usersLoading } = useUsers()
  const assignMut = useAssignRole()
  const revokeMut = useRevokeRole()
  const registerMut = useRegister()

  const userMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const u of managedUsers) {
      map.set(u.id, u.roles)
    }
    return map
  }, [managedUsers])

  function getMemberStatus(member: typeof members[0]) {
    const uid = member.userId
    if (!uid || !userMap.has(uid)) return { hasAccount: false, isAdmin: false }
    const roles = userMap.get(uid)!
    return { hasAccount: true, isAdmin: roles.includes(ADMIN_ROLE) }
  }

  async function handleAssign(memberId: number, userId: string) {
    try {
      await assignMut.mutateAsync({ userId, roleId: ADMIN_ROLE })
      toast.success('Admin role assigned')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign admin role')
    }
  }

  async function handleRevoke(memberId: number, userId: string) {
    try {
      await revokeMut.mutateAsync({ userId, roleId: ADMIN_ROLE })
      toast.success('Admin role removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove admin role')
    }
  }

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault()
    if (!showCreate || !newUsername.trim() || !newPassword.trim()) return
    try {
      await registerMut.mutateAsync({
        username: newUsername.trim(),
        password: newPassword,
        churchId: churchId || undefined,
      })
      toast.success('Account created. Now assign the admin role.')
      setShowCreate(null)
      setNewUsername('')
      setNewPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account')
    }
  }

  const loading = isLoading || usersLoading

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Church Admins</h2>
          <p className="page-subtitle">Manage which members have church admin access</p>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 320, marginBottom: '1rem' }}>
        <span style={{
          position: 'absolute', left: '0.625rem', top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)', pointerEvents: 'none',
          display: 'flex',
        }}>
          <IconSearch />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members..."
          style={{
            width: '100%', padding: '0.4375rem 2rem 0.4375rem 2rem',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem', outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
        />
        {query && (
          <button
            style={{
              position: 'absolute', right: '0.375rem', top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '1.125rem', height: '1.125rem',
              border: 'none', borderRadius: '50%',
              background: 'var(--color-bg)', color: 'var(--color-text-muted)',
              cursor: 'pointer', padding: 0,
            }}
            onClick={() => setQuery('')}
          >
            <IconX />
          </button>
        )}
      </div>

      {loading && (
        <Skeleton.Table rows={5} cols={5} />
      )}

      {!loading && members.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--color-bg)', margin: '0 auto 0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconShield />
          </div>
          {query ? 'No members match your search' : 'No members found'}
        </div>
      )}

      {!loading && members.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Church</th>
              <th>Auth Account</th>
              <th>Admin Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const { hasAccount, isAdmin } = getMemberStatus(m)
              const fullName = [m.firstName, m.middleName, m.lastName].filter(Boolean).join(' ')
              return (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{fullName}</td>
                  <td>{m.tel || m.phoneNumber || '-'}</td>
                  <td>{m.church?.name || '-'}</td>
                  <td>
                    <span className={`badge ${hasAccount ? 'badge-success' : 'badge-secondary'}`}>
                      {hasAccount ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    {hasAccount ? (
                      <span className={`badge ${isAdmin ? 'badge-primary' : 'badge-secondary'}`}>
                        {isAdmin ? 'Church Admin' : 'Member'}
                      </span>
                    ) : (
                      <span className="badge badge-secondary">N/A</span>
                    )}
                  </td>
                  <td className="table-actions">
                    {!hasAccount && (
                      <button className="btn btn-sm btn-outline" onClick={() => setShowCreate(m.id)}>
                        <IconUserPlus /> Create Account
                      </button>
                    )}
                    {hasAccount && !isAdmin && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleAssign(m.id, m.userId!)} disabled={assignMut.isPending}>
                        Make Admin
                      </button>
                    )}
                    {hasAccount && isAdmin && (
                      <button className="btn btn-sm btn-outline" style={{ color: 'var(--color-error)' }} onClick={() => handleRevoke(m.id, m.userId!)} disabled={revokeMut.isPending}>
                        Remove Admin
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      )}

      {showCreate && (
        <div className="mf-overlay" onClick={() => setShowCreate(null)}>
          <div className="mf-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="mf-header">
              <div className="mf-header-icon"><IconUserPlus /></div>
              <div className="mf-header-text">
                <h3 className="mf-header-title">Create Auth Account</h3>
                <p className="mf-header-sub">Create a login account for this member</p>
              </div>
              <button className="mf-close" onClick={() => setShowCreate(null)}><IconClose /></button>
            </div>
            <form onSubmit={handleCreateAccount}>
              <div className="mf-body">
                <div className="mf-grid">
                  <div className="mf-field full">
                    <label className="mf-label">Username <span className="required">*</span></label>
                    <input className="mf-input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required autoFocus />
                  </div>
                  <div className="mf-field full">
                    <label className="mf-label">Password <span className="required">*</span></label>
                    <input className="mf-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="mf-footer">
                <button type="button" className="mf-btn mf-btn-cancel" onClick={() => setShowCreate(null)}><IconX /> Cancel</button>
                <button type="submit" className="mf-btn mf-btn-save" disabled={registerMut.isPending}>
                  {registerMut.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
