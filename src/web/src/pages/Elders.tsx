import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useEldersList, useCreateElder, useDeleteElder } from '../hooks/usePeople'
import { useAuth } from '../context/AuthContext'
import { peopleApi, type Person } from '../services/api'
import { unwrap } from '../hooks/useApi'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import Skeleton from '../shared/components/Skeleton'

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)

const PAGE_SIZE = 10

export default function Elders() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const allPerms = (user?.permissions ?? []).map((p) => p.toLowerCase())
  const canCreate = allPerms.includes('can_create_elders')
  const canRead = allPerms.includes('can_read_elders')
  const canDelete = allPerms.includes('can_delete_elders')

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)

  const { data: elders = [], isLoading } = useEldersList()
  const deleteMut = useDeleteElder()

  const filtered = query.trim()
    ? elders.filter((p) =>
        `${p.firstName} ${p.lastName} ${p.emailAddress ?? ''} ${p.tel ?? ''}`.toLowerCase().includes(query.toLowerCase()),
      )
    : elders
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(String(deleteTarget.id))
      toast.success('Elder removed')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Elders</h2>
          <p className="page-subtitle">Manage church elders</p>
        </div>
        {canCreate && (
          <button className="btn btn-create" onClick={() => setShowAddModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Elder
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
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
            placeholder="Search elders..."
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
            >
              <IconX />
            </button>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
          {filtered.length} elder{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading && (
        <div className="settings-table-wrap">
          <Skeleton.Table rows={5} cols={5} />
        </div>
      )}

      {!isLoading && paged.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {query ? 'No elders match your search' : 'No elders found'}
        </div>
      )}

      {!isLoading && paged.length > 0 && (
        <>
          <div className="settings-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Elder</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th className="settings-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => {
                  const initials = `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase()
                  const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/elders/${p.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary), #5c0e0e)',
                            color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fullName}</div>
                            {p.emailAddress && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.emailAddress}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p.tel || '—'}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p.emailAddress || '—'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{p.gender || '—'}</td>
                      <td className="settings-td-actions">
                        <div className="btn-icon-group">
                          {canRead && (
                            <button className="btn-icon" data-tooltip="View" onClick={(e) => { e.stopPropagation(); navigate(`/elders/${p.id}`) }}>
                              <IconEye />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-icon btn-icon-danger"
                              data-tooltip="Remove"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(p) }}
                            >
                              <IconTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination pagination-right" style={{ marginTop: '1.25rem' }}>
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
          </div>
        </>
      )}

      {showAddModal && (
        <AddElderModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => setShowAddModal(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Elder"
        message={deleteTarget ? `Are you sure you want to remove ${deleteTarget.firstName} ${deleteTarget.lastName} as elder?` : ''}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}

function AddElderModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const createMut = useCreateElder()

  const doSearch = useCallback(async (query: string) => {
    setSearching(true)
    try {
      const data = await unwrap(peopleApi.search(query.trim()))
      const list = 'content' in data ? data.content : data
      setResults(list)
      setSearched(true)
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => { doSearch('') }, [doSearch])

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    doSearch(search)
  }, [search, doSearch])

  async function handleMakeElder(person: Person) {
    setAssigningId(person.id)
    try {
      await createMut.mutateAsync({ memberId: person.id })
      toast.success(`${person.firstName} ${person.lastName} is now an elder`)
      onAdded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="mf-overlay" onClick={onClose}>
      <div className="mf-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
        <div className="mf-header">
          <div className="mf-header-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="mf-header-text">
            <h3 className="mf-header-title">Add Elder</h3>
            <p className="mf-header-sub">Search for a baptised member to assign as elder</p>
          </div>
          <button className="mf-close" onClick={onClose}><IconClose /></button>
        </div>

        <div className="mf-body">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none',
              }}>
                <IconSearch />
              </span>
              <input
                className="mf-input"
                style={{ paddingLeft: '2.25rem' }}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={searching} style={{ minWidth: 70, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
              {searching ? (
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : 'Search'}
            </button>
          </form>

          {!searched && !searching && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Skeleton.Table rows={3} cols={3} />
            </div>
          )}

          {searching && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Skeleton.Table rows={3} cols={3} />
            </div>
          )}

          {searched && !searching && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              No baptised members found matching your search
            </div>
          )}

          {searched && !searching && results.length > 0 && (
            <div className="settings-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th className="settings-th-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => {
                    const initials = `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase()
                    const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 30, height: 30, borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--color-primary), #5c0e0e)',
                              color: '#fff', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <span style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{fullName}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p.tel || '—'}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p.emailAddress || '—'}</td>
                        <td className="settings-td-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ gap: '0.375rem' }}
                            disabled={assigningId === p.id || createMut.isPending}
                            onClick={() => handleMakeElder(p)}
                          >
                            {assigningId === p.id ? (
                              <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : (
                              <IconCheck />
                            )}
                            Make Elder
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
