import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { usePastor, useUpdatePastor, useDeletePastor, usePastorRoles, usePeopleList } from '../hooks/usePeople'
import { useAllChurches } from '../hooks/useChurches'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import Skeleton from '../shared/components/Skeleton'
import type { Person } from '../services/api'

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
)
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
)
const IconEmail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
)
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconChurch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)

interface EditForm {
  pastorRoleId: number | ''; churchId: number | ''; memberId: number | ''
}

export default function PastorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: pastor, isLoading } = usePastor(id)
  const { data: roles = [] } = usePastorRoles()
  const { data: churchPage } = useAllChurches()
  const churches = churchPage?.content ?? []
  const updateMut = useUpdatePastor()
  const deleteMut = useDeletePastor()

  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    pastorRoleId: '', churchId: '', memberId: '',
  })
  const [memberSearch, setMemberSearch] = useState('')
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState('')
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [memberPage, setMemberPage] = useState(0)
  const memberRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMemberSearch(memberSearch), 300)
    return () => clearTimeout(timer)
  }, [memberSearch])

  useEffect(() => {
    setMemberPage(0)
  }, [debouncedMemberSearch])

  const { data: memberPageData } = usePeopleList({
    search: debouncedMemberSearch || undefined,
    baptised: 'true',
    page: memberPage,
    size: 10,
  })
  const memberOptions = memberPageData?.content ?? []
  const memberTotalPages = memberPageData?.totalPages ?? 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectMember(m: Person) {
    setEditForm({ ...editForm, memberId: Number(m.id) })
    setMemberSearch(`${m.firstName} ${m.lastName}`)
    setShowMemberDropdown(false)
  }

  function openEdit() {
    if (!pastor) return
    setEditForm({
      pastorRoleId: pastor.pastorRoleId ?? '',
      churchId: pastor.church?.id ? Number(pastor.church.id) : '',
      memberId: Number(pastor.id),
    })
    setMemberSearch(`${pastor.firstName} ${pastor.lastName}`)
    setShowEdit(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!pastor) return
    try {
      const payload = {
        memberId: editForm.memberId !== '' ? Number(editForm.memberId) : undefined,
        pastorRoleId: editForm.pastorRoleId !== '' ? Number(editForm.pastorRoleId) : undefined,
        churchId: editForm.churchId !== '' ? Number(editForm.churchId) : undefined,
      }
      if (!payload.memberId) { toast.error('Please select a member'); return }
      if (!payload.pastorRoleId) { toast.error('Pastor role is required'); return }
      if (!payload.churchId) { toast.error('Church is required'); return }
      await updateMut.mutateAsync({
        id: String(pastor.id),
        data: payload as { memberId: number; pastorRoleId: number; churchId: number },
      })
      toast.success('Pastor updated')
      setShowEdit(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const [deleteTarget, setDeleteTarget] = useState(false)
  async function handleDelete() {
    if (!pastor) return
    try {
      await deleteMut.mutateAsync(String(pastor.id))
      toast.success('Pastor deleted')
      navigate('/pastors', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
    setDeleteTarget(false)
  }

  if (isLoading) {
    return (
      <div className="page">
        <header className="cd-hero">
          <div className="cd-hero-top">
            <Skeleton.Circle size={64} />
            <div style={{ flex: 1 }}>
              <Skeleton width="200px" height={24} style={{ marginBottom: '0.5rem' }} />
              <Skeleton width="120px" height={16} />
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--color-border)', margin: '1.25rem 0' }} />
          <div className="pd-grid">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="pd-grid-item">
                <Skeleton width="100%" height={14} />
              </div>
            ))}
          </div>
        </header>
        <Skeleton.Table rows={5} cols={3} />
      </div>
    )
  }

  if (!pastor) {
    return (
      <div className="page">
        <div className="cd-empty">
          <h2>Pastor not found</h2>
          <button className="btn btn-outline" onClick={() => navigate('/pastors')}>
            <IconArrowLeft /> Back to Pastors
          </button>
        </div>
      </div>
    )
  }

  const initials = `${pastor.firstName.charAt(0)}${pastor.lastName.charAt(0)}`

  return (
    <div className="page">
      <nav className="cd-breadcrumb">
        <button className="cd-breadcrumb-link" onClick={() => navigate('/pastors')}>
          <IconArrowLeft /> Pastors
        </button>
        <span className="cd-breadcrumb-sep">/</span>
        <span className="cd-breadcrumb-current">{pastor.firstName} {pastor.lastName}</span>
      </nav>

      <header className="cd-hero">
        <div className="cd-hero-top">
          <div className="cd-hero-avatar">
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="cd-hero-title">
              {pastor.firstName} {pastor.middleName ? `${pastor.middleName} ` : ''}{pastor.lastName}
            </h1>
            <span className="cd-hero-badge">{pastor.position || 'Pastor'}</span>
          </div>
          <div className="cd-hero-actions">
            <button className="btn btn-outline btn-sm" onClick={openEdit}>
              <IconEdit /> Edit
            </button>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(true)}>
              <IconTrash /> Delete
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '1.25rem 0' }} />

        <div className="pd-grid">
          <div className="pd-grid-item">
            <div className="pd-grid-icon"><IconEmail /></div>
            <div>
              <div className="cd-hero-meta-label">Email</div>
              <div className="cd-hero-meta-value">{pastor.email || '—'}</div>
            </div>
          </div>
          <div className="pd-grid-item">
            <div className="pd-grid-icon"><IconPhone /></div>
            <div>
              <div className="cd-hero-meta-label">Phone</div>
              <div className="cd-hero-meta-value">{pastor.phoneNumber || '—'}</div>
            </div>
          </div>
          <div className="pd-grid-item">
            <div className="pd-grid-icon"><IconUser /></div>
            <div>
              <div className="cd-hero-meta-label">Gender</div>
              <div className="cd-hero-meta-value">{pastor.gender || '—'}</div>
            </div>
          </div>
          <div className="pd-grid-item">
            <div className="pd-grid-icon"><IconUser /></div>
            <div>
              <div className="cd-hero-meta-label">Role</div>
              <div className="cd-hero-meta-value">{pastor.position || '—'}</div>
            </div>
          </div>
          <div className="pd-grid-item">
            <div className="pd-grid-icon"><IconChurch /></div>
            <div>
              <div className="cd-hero-meta-label">Church</div>
              <div className="cd-hero-meta-value">{pastor.church?.name || '—'}</div>
            </div>
          </div>
        </div>
      </header>

      {showEdit && (
        <div className="mf-overlay" onClick={() => setShowEdit(false)}>
          <div className="mf-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mf-header">
              <div className="mf-header-icon"><IconUser /></div>
              <div className="mf-header-text">
                <h3 className="mf-header-title">Edit Pastor</h3>
                <p className="mf-header-sub">Update pastor information</p>
              </div>
              <button className="mf-close" onClick={() => setShowEdit(false)}><IconX /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="mf-body">
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconUser /> Link to Member</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
                    Search for a member to update this pastor's personal details.
                  </p>
                  <div className="mf-field full" ref={memberRef}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconSearch /></span>
                      <input className="mf-input" style={{ paddingLeft: '2.25rem' }}
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(e) => { setMemberSearch(e.target.value); setShowMemberDropdown(true) }}
                        onFocus={() => setShowMemberDropdown(true)}
                        autoComplete="off"
                      />
                      {showMemberDropdown && (
                        <div className="searchable-select-dropdown">
                          {memberOptions.length > 0 ? (
                            <>
                              {memberOptions.map((m) => (
                                <div key={m.id} className="searchable-select-option"
                                  onClick={() => selectMember(m)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {m.firstName} {m.lastName}
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                                    {m.email || ''}
                                  </span>
                                </div>
                              ))}
                              {memberTotalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.375rem', padding: '0.375rem', borderTop: '1px solid var(--color-border)' }}>
                                  <button className="btn btn-sm btn-outline" style={{ fontSize: '0.7rem', lineHeight: 1, padding: '0.125rem 0.375rem' }} disabled={memberPage === 0} onClick={(e) => { e.preventDefault(); setMemberPage(p => p - 1) }}>‹</button>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{memberPage + 1} / {memberTotalPages}</span>
                                  <button className="btn btn-sm btn-outline" style={{ fontSize: '0.7rem', lineHeight: 1, padding: '0.125rem 0.375rem' }} disabled={memberPage >= memberTotalPages - 1} onClick={(e) => { e.preventDefault(); setMemberPage(p => p + 1) }}>›</button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="searchable-select-empty">No matching members</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mf-section">
                  <h4 className="mf-section-title">Pastor Details</h4>
                  <div className="mf-grid">
                    <div className="mf-field">
                      <label className="mf-label">Pastor Role</label>
                      <select className="mf-input" value={editForm.pastorRoleId} onChange={(e) => setEditForm({ ...editForm, pastorRoleId: e.target.value ? Number(e.target.value) : '' })}>
                        <option value="">Select role…</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">Church</label>
                      <select className="mf-input" value={editForm.churchId} onChange={(e) => setEditForm({ ...editForm, churchId: e.target.value ? Number(e.target.value) : '' })}>
                        <option value="">Select church…</option>
                        {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mf-footer">
                <button type="button" className="mf-btn mf-btn-cancel" onClick={() => setShowEdit(false)}><IconX /> Cancel</button>
                <button type="submit" className="mf-btn mf-btn-save" disabled={updateMut.isPending}>
                  {updateMut.isPending && <span className="mf-spinner" />}
                  {updateMut.isPending ? 'Saving...' : <><IconCheck /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget}
        title="Delete this pastor?"
        message="This action cannot be undone. The pastor will be permanently removed from the system."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(false)}
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}
