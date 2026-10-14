import { useState, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast, showConfirm } from '../shared/utils/swal'
import { useAuth } from '../context/AuthContext'
import { useAnnouncementsList, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements'
import { useRolesList } from '../hooks/useRoles'
import Skeleton from '../shared/components/Skeleton'


interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  expiresAt: string
  rolesAllowed: string[]
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
)
const IconMegaphone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)

function formatDate(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleDateString()
}

export default function Announcements() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const allPerms = (user?.permissions ?? []).map((p) => p.toLowerCase())
  const canCreate = allPerms.includes('can_create_announcements')
  const canView = allPerms.includes('can_view_announcements')
  const canUpdate = allPerms.includes('can_update_announcements')
  const canDelete = allPerms.includes('can_delete_announcements')

  const { data: announcementsData, isLoading: aLoading } = useAnnouncementsList()
  const { data: rolesData } = useRolesList()
  const createAnnMut = useCreateAnnouncement()
  const updateAnnMut = useUpdateAnnouncement()
  const deleteAnnMut = useDeleteAnnouncement()

  const announcements = Array.isArray(announcementsData) ? announcementsData as Announcement[] : []
  const roles = Array.isArray(rolesData) ? (rolesData as { name: string }[]).map((r) => r.name) : []
  const loading = aLoading

  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [viewing, setViewing] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ title: '', content: '', priority: 'LOW', expiresAt: '', rolesAllowed: [] as string[] })
  const saving = createAnnMut.isPending || updateAnnMut.isPending

  useEffect(() => {
    if (!showForm && !viewing) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { closeForm(); closeView() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showForm, viewing])

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  function openView(a: Announcement) {
    setViewing(a)
  }

  function closeView() {
    setViewing(null)
  }

  function openCreate() {
    setEditing(null)
    setForm({ title: '', content: '', priority: 'LOW', expiresAt: '', rolesAllowed: [] })
    setShowForm(true)
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority || 'LOW',
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : '',
      rolesAllowed: a.rolesAllowed ?? [],
    })
    setShowForm(true)
  }

  function toggleRole(role: string) {
    setForm((prev) => ({
      ...prev,
      rolesAllowed: prev.rolesAllowed.includes(role)
        ? prev.rolesAllowed.filter((r) => r !== role)
        : [...prev.rolesAllowed, role],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { showErrorToast(t('validation.requiredFields')); return }
    try {
      const payload = { title: form.title, content: form.content, priority: form.priority, expiresAt: form.expiresAt, rolesAllowed: form.rolesAllowed }
      if (editing) {
        await updateAnnMut.mutateAsync({ id: editing.id, data: payload })
        showSuccessToast('Announcement updated')
      } else {
        await createAnnMut.mutateAsync(payload)
        showSuccessToast('Announcement created')
      }
      closeForm()
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  async function handleDelete(a: Announcement) {
    const ok = await showConfirm({ title: 'Delete?', text: 'This cannot be undone.', danger: true })
    if (!ok) return
    try {
      await deleteAnnMut.mutateAsync(a.id)
      showSuccessToast('Announcement deleted')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const filtered = query.trim()
    ? announcements.filter((a) =>
        `${a.title} ${a.content} ${a.priority}`.toLowerCase().includes(query.toLowerCase()),
      )
    : announcements

  const priorityBadge = (priority: string) => (
    <span className={`badge badge-${priority === 'HIGH' || priority === 'URGENT' ? 'priority' : 'secondary'}`}>{priority}</span>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Announcements</h2>
          <p className="page-subtitle">Manage church announcements</p>
        </div>
        {canCreate && (
          <button className="btn btn-create" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>New Announcement</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none', display: 'flex',
          }}>
            <IconSearch />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements..."
            style={{
              width: '100%', padding: '0.4375rem 2rem 0.4375rem 2rem',
              border: '1px solid var(--color-border)', borderRadius: 6,
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          {query && (
            <button
              style={{
                position: 'absolute', right: '0.375rem', top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '1.125rem', height: '1.125rem', border: 'none', borderRadius: '50%',
                background: 'var(--color-bg)', color: 'var(--color-text-muted)',
                cursor: 'pointer', padding: 0,
              }}
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <IconX />
            </button>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
          {filtered.length} announcement{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div className="settings-table-wrap">
          <Skeleton.Table rows={5} cols={5} />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {query ? 'No announcements match your search' : 'No announcements found'}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="settings-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="settings-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Priority</th>
                <th>Expires</th>
                <th className="settings-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary), #5c0e0e)',
                        color: '#fff', flexShrink: 0,
                      }}>
                        <IconMegaphone />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.title}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    <span className="cell-truncate" style={{ maxWidth: 340 }} title={a.content}>
                      {a.content.length > 80 ? a.content.slice(0, 80) + '…' : a.content}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{priorityBadge(a.priority)}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(a.expiresAt)}</td>
                  <td className="settings-td-actions">
                    <div className="btn-icon-group">
                      {canView && (
                        <button className="btn-icon" data-tooltip="View" aria-label="View" onClick={() => openView(a)}>
                          <IconEye />
                        </button>
                      )}
                      {canUpdate && (
                        <button className="btn-icon" data-tooltip="Edit" aria-label="Edit" onClick={() => openEdit(a)}>
                          <IconEdit />
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn-icon btn-icon-danger" data-tooltip="Delete" aria-label="Delete" onClick={() => handleDelete(a)}>
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="dialog-overlay" onClick={closeForm}>
          <div className="dialog dialog-lg announcement-dialog" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Announcement' : 'New Announcement'} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-header-icon">
                <IconMegaphone />
              </div>
              <div className="modal-header-text">
                <h3>{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
                <p className="modal-subtitle">
                  {editing ? 'Update the announcement details below.' : 'Share an update with your congregation.'}
                </p>
              </div>
              <button type="button" className="close-btn" onClick={closeForm} aria-label="Close"><IconClose /></button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="ann-title">Title <span className="required">*</span></label>
                  <input id="ann-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Christmas Carol Service" autoFocus />
                </div>

                <div className="form-group">
                  <label htmlFor="ann-content">Content <span className="required">*</span></label>
                  <textarea id="ann-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Write the announcement message…" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <span className="form-label">Priority</span>
                    <div className="seg-group" role="radiogroup" aria-label="Priority">
                      {PRIORITIES.map((p) => (
                        <button
                          type="button"
                          key={p}
                          role="radio"
                          aria-checked={form.priority === p}
                          className={`seg-btn seg-${p.toLowerCase()}${form.priority === p ? ' active' : ''}`}
                          onClick={() => setForm({ ...form, priority: p })}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ann-expires">Expires At</label>
                    <input id="ann-expires" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <span className="form-label">Visible to Roles</span>
                  {roles.length === 0 ? (
                    <p className="form-hint">No roles available.</p>
                  ) : (
                    <div className="role-chips">
                      {roles.map((role) => {
                        const active = form.rolesAllowed.includes(role)
                        return (
                          <button
                            type="button"
                            key={role}
                            aria-pressed={active}
                            className={`role-chip${active ? ' active' : ''}`}
                            onClick={() => toggleRole(role)}
                          >
                            {role}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <footer className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeForm} disabled={saving}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="mf-spinner" style={{ marginRight: '0.375rem' }} />}
                  {saving ? t('common.loading') : (editing ? 'Save Changes' : t('common.save'))}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="dialog-overlay" onClick={closeView}>
          <div className="dialog dialog-lg announcement-dialog" role="dialog" aria-modal="true" aria-label={viewing.title} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-header-icon">
                <IconMegaphone />
              </div>
              <div className="modal-header-text">
                <h3>{viewing.title}</h3>
                <p className="modal-subtitle">Announcement details</p>
              </div>
              <button type="button" className="close-btn" onClick={closeView} aria-label="Close"><IconClose /></button>
            </header>

            <div className="modal-body">
              <div className="view-meta">{priorityBadge(viewing.priority)}</div>

              <div className="view-block">
                <span className="form-label">Content</span>
                <p className="view-text">{viewing.content}</p>
              </div>

              <div className="view-block">
                <span className="form-label">Expires</span>
                <p className="view-text">{formatDate(viewing.expiresAt)}</p>
              </div>

              <div className="view-block">
                <span className="form-label">Visible to Roles</span>
                {viewing.rolesAllowed?.length ? (
                  <div className="role-chips">
                    {viewing.rolesAllowed.map((r) => <span key={r} className="role-chip-view">{r}</span>)}
                  </div>
                ) : (
                  <p className="form-hint">All roles</p>
                )}
              </div>
            </div>

            <footer className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={closeView}>Done</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
