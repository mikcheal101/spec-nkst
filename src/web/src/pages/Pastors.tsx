import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { usePastorsList, useCreatePastor, useUpdatePastor, useDeletePastor, usePastorRoles, usePeopleList } from '../hooks/usePeople'
import { useAllChurches } from '../hooks/useChurches'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import Skeleton from '../shared/components/Skeleton'
import type { Person } from '../services/api'

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
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
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
)
const IconArrowUpDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
)

const PAGE_SIZE = 15

interface FormData {
  pastorRoleId: number | ''; churchId: number | ''; memberId: number | ''
}
const emptyForm: FormData = {
  pastorRoleId: '', churchId: '', memberId: '',
}

export default function Pastors() {
  const navigate = useNavigate()
  const { data: pastors = [], isLoading } = usePastorsList()
  const { data: roles = [] } = usePastorRoles()
  const { data: churchPage } = useAllChurches()
  const churches = churchPage?.content ?? []
  const createMut = useCreatePastor()
  const updateMut = useUpdatePastor()
  const deleteMut = useDeletePastor()

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

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

  const allRoles = [...new Set(pastors.map((p) => p.position).filter(Boolean))] as string[]

  const filtered = pastors.filter((p) => {
    const matchSearch = !query.trim() || `${p.firstName} ${p.lastName} ${p.middleName ?? ''} ${p.email ?? ''} ${p.phoneNumber ?? ''} ${p.position ?? ''} ${p.church?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())
    const matchRole = !roleFilter || p.position === roleFilter
    return matchSearch && matchRole
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = a.firstName.localeCompare(b.firstName)
    return sortAsc ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  function selectMember(m: Person) {
    setForm({ ...form, memberId: Number(m.id) })
    setMemberSearch(`${m.firstName} ${m.lastName}`)
    setShowMemberDropdown(false)
  }

  function openCreate() { setEditing(null); setForm(emptyForm); setMemberSearch(''); setShowForm(true) }
  function openEdit(p: Person) {
    setEditing(p)
    setForm({
      pastorRoleId: p.pastorRoleId ?? '',
      churchId: p.church?.id ?? '',
      memberId: Number(p.id),
    })
    setMemberSearch(`${p.firstName} ${p.lastName}`)
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        memberId: form.memberId !== '' ? Number(form.memberId) : undefined,
        pastorRoleId: form.pastorRoleId !== '' ? Number(form.pastorRoleId) : undefined,
        churchId: form.churchId !== '' ? Number(form.churchId) : undefined,
      }
      if (!payload.memberId) { toast.error('Please select a member'); return }
      if (!payload.pastorRoleId) { toast.error('Pastor role is required'); return }
      if (!payload.churchId) { toast.error('Church is required'); return }
      if (editing) {
        await updateMut.mutateAsync({ id: String(editing.id), data: payload as { memberId: number; pastorRoleId: number; churchId: number } })
        toast.success('Pastor updated')
      } else {
        await createMut.mutateAsync(payload as { memberId: number; pastorRoleId: number; churchId: number })
        toast.success('Pastor created')
      }
      setShowForm(false)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Operation failed') }
  }

  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(String(deleteTarget.id))
      toast.success('Pastor deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
    setDeleteTarget(null)
  }

  function toggleSort() { setSortAsc(!sortAsc) }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pastors</h2>
          <p className="page-subtitle">
            <span className="subtitle-count">{sorted.length}</span> {sorted.length === 1 ? 'pastor' : 'pastors'} · Manage church leadership
          </p>
        </div>
        <button className="btn btn-create" onClick={openCreate}><IconPlus /> Add Pastor</button>
      </div>

      {allRoles.length > 0 && (
        <div className="filter-tabs">
          <button className={`filter-tab ${!roleFilter ? 'active' : ''}`} onClick={() => { setRoleFilter(''); setPage(0) }}>All</button>
          {allRoles.map((r) => (
            <button key={r} className={`filter-tab ${roleFilter === r ? 'active' : ''}`} onClick={() => { setRoleFilter(r); setPage(0) }}>{r}</button>
          ))}
        </div>
      )}

      <div className="toolbar">
        <div className="search-field">
          <IconSearch />
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} placeholder="Search pastors…" />
          {query && <button className="search-clear" onClick={() => setQuery('')}><IconX /></button>}
        </div>
        <button className="sort-btn" onClick={toggleSort}>
          <IconArrowUpDown /> {sortAsc ? 'A–Z' : 'Z–A'}
        </button>
      </div>

      {isLoading ? (
        <div className="premium-table-wrapper"><Skeleton.Table rows={5} cols={5} /></div>
      ) : paged.length === 0 ? (
        <div className="premium-empty">
          <div className="premium-empty-icon">🙏</div>
          <h3>No pastors found</h3>
          <p>{query || roleFilter ? 'Try adjusting your search or filters' : 'Add your first pastor to get started'}</p>
        </div>
      ) : (
        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Pastor</th>
                <th>Role</th>
                <th>Church</th>
                <th>Gender</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => {
                const initials = `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`
                return (
                  <tr key={p.id} onClick={() => navigate(`/pastors/${p.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="person-cell">
                        <div className="person-avatar">{initials}</div>
                        <div className="person-info">
                          <span className="person-name">{p.firstName} {p.lastName}</span>
                          {(p.email || p.phoneNumber) && (
                            <span className="person-email">{p.email || p.phoneNumber}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="role-badge">{p.position || 'Pastor'}</span></td>
                    <td>
                      {p.church?.name ? (
                        <span className="church-cell"><IconMapPin /> {p.church.name}</span>
                      ) : (
                        <span className="gender-cell">&mdash;</span>
                      )}
                    </td>
                    <td><span className="gender-cell">{p.gender || '—'}</span></td>
                    <td className="td-actions">
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="table-action-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/pastors/${p.id}`) }}
                          title="View"
                        ><IconEye /></button>
                        <button className="table-action-btn"
                          onClick={(e) => { e.stopPropagation(); openEdit(p) }}
                          title="Edit"
                        ><IconEdit /></button>
                        <button className="table-action-btn"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(p) }}
                          title="Delete"
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                        ><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination pagination-right">
        <button className="btn btn-sm btn-outline" disabled={totalPages <= 1 || safePage === 0} onClick={() => setPage(0)}>«</button>
        <button className="btn btn-sm btn-outline" disabled={totalPages <= 1 || safePage === 0} onClick={() => setPage(safePage - 1)}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => i)
          .filter((i) => totalPages <= 1 || i === 0 || i === totalPages - 1 || Math.abs(i - safePage) <= 1)
          .map((i, idx, arr) => (
            <span key={i} style={{ display: 'contents' }}>
              {totalPages > 1 && idx > 0 && arr[idx - 1] !== i - 1 && <span className="pagination-ellipsis">…</span>}
              <button className={`btn btn-sm ${i === safePage ? 'btn-primary' : 'btn-outline'}`} disabled={totalPages <= 1} onClick={() => setPage(i)}>{i + 1}</button>
            </span>
          ))}
        <button className="btn btn-sm btn-outline" disabled={totalPages <= 1 || safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>›</button>
        <button className="btn btn-sm btn-outline" disabled={totalPages <= 1 || safePage >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
        <span className="pagination-info">{sorted.length} record{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      {showForm && (
        <div className="mf-overlay" onClick={() => setShowForm(false)}>
          <div className="mf-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mf-header">
              <div className="mf-header-icon"><IconUser /></div>
              <div className="mf-header-text">
                <h3 className="mf-header-title">{editing ? 'Edit Pastor' : 'Add Pastor'}</h3>
                <p className="mf-header-sub">{editing ? 'Update pastor information' : 'Add a new church pastor'}</p>
              </div>
              <button className="mf-close" onClick={() => setShowForm(false)}><IconX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mf-body">
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconUser /> Link to Member</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
                    Search for a baptised member to link as a pastor.
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
                      <select className="mf-input" value={form.pastorRoleId} onChange={(e) => setForm({ ...form, pastorRoleId: e.target.value ? Number(e.target.value) : '' })}>
                        <option value="">Select role…</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">Church</label>
                      <select className="mf-input" value={form.churchId} onChange={(e) => setForm({ ...form, churchId: e.target.value ? Number(e.target.value) : '' })}>
                        <option value="">Select church…</option>
                        {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mf-footer">
                <button type="button" className="mf-btn mf-btn-cancel" onClick={() => setShowForm(false)}><IconX /> Cancel</button>
                <button type="submit" className="mf-btn mf-btn-save" disabled={createMut.isPending || updateMut.isPending}>
                  {(createMut.isPending || updateMut.isPending) && <span className="mf-spinner" />}
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : <><IconCheck /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this pastor?"
        message="This action cannot be undone. The pastor will be permanently removed from the system."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}
