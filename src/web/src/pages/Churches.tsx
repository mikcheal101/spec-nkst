import { useState, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useChurches, useCreateChurch, useUpdateChurch, useDeleteChurch, useAllChurches, useChurchesAdminStatus } from '../hooks/useChurches'
import { useAuth } from '../context/AuthContext'
import { SearchableSelect } from '../shared/components'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import Skeleton from '../shared/components/Skeleton'
import type { Church, ChurchRequest } from '../services/api'

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
)
const IconChurch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)
const IconMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
)
const IconHierarchy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconShield = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)

const PAGE_SIZE = 12
const SORTS = [
  { value: '', label: 'Default' },
  { value: 'name,asc', label: 'Name A\u2013Z' },
  { value: 'name,desc', label: 'Name Z\u2013A' },
]

interface FormData {
  name: string
  address: string
  parentChurchId: number | null
}
const emptyForm: FormData = { name: '', address: '', parentChurchId: null }

function SelectFilter({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '0.375rem 1.75rem 0.375rem 0.625rem',
          fontSize: '0.75rem', fontWeight: 500,
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          background: 'var(--color-surface)',
          color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
          outline: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
          appearance: 'none',
          minWidth: 110,
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: '0.375rem', top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--color-text-muted)', pointerEvents: 'none',
        display: 'flex',
      }}>
        <IconChevronDown />
      </span>
    </div>
  )
}

export default function Churches() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const allPerms = (user?.permissions ?? []).map((p) => p.toLowerCase())
  const canCreate = allPerms.includes('can_create_church')
  const canUpdate = allPerms.includes('can_update_church')
  const canDelete = allPerms.includes('can_delete_church')
  const canRead = allPerms.includes('can_read_church')
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('')

  const { data, isLoading } = useChurches(page, PAGE_SIZE, query || undefined, sort || undefined)
  const { data: allData } = useAllChurches()
  const createMut = useCreateChurch()
  const updateMut = useUpdateChurch()
  const deleteMut = useDeleteChurch()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Church | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Church | null>(null)

  const churches = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0
  const allChurches = allData?.content ?? []

  const churchIds = useMemo(() => churches.map((c) => c.id), [churches])
  const adminStatusMap = useChurchesAdminStatus(churchIds)

  function openCreate() {
    setEditTarget(null); setForm(emptyForm); setShowForm(true)
  }

  function openEdit(church: Church) {
    setEditTarget(church)
    setForm({
      name: church.name,
      address: church.address,
      parentChurchId: church.parentChurch?.id ?? church.parentChurchId ?? null,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim()) {
      toast.error(t('validation.requiredFields'))
      return
    }
    const payload: ChurchRequest = {
      name: form.name.trim(),
      address: form.address.trim(),
      parentChurchId: form.parentChurchId,
    }
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, data: payload })
        toast.success(t('common.success'))
      } else {
        await createMut.mutateAsync(payload)
        toast.success(t('churches.createSuccess'))
      }
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success(t('common.success'))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function handleSearch(val: string) {
    setQuery(val); setPage(0)
  }

  function parentName(church: Church): string {
    if (church.parentChurch) return church.parentChurch.name
    if (church.parentChurchId) {
      const parent = allChurches.find((c) => c.id === church.parentChurchId)
      if (parent) return parent.name
      return `#${church.parentChurchId}`
    }
    return ''
  }

  const safePage = Math.min(page, Math.max(totalPages - 1, 0))
  const hasFilters = !!query

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t('churches.title')}</h2>
          <p className="page-subtitle">{t('churches.description')}</p>
        </div>
        {canCreate && (
          <button className="btn btn-create" onClick={openCreate}>
            <IconPlus /> {t('churches.createChurch')}
          </button>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        marginBottom: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
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
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search churches by name or address"
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
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
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
              onClick={() => handleSearch('')}
            >
              <IconX />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
          {hasFilters && (
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.375rem 0.625rem',
                fontSize: '0.75rem', fontWeight: 500,
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
              onClick={() => { setQuery(''); setPage(0) }}
            >
              <IconX /> Clear
            </button>
          )}
          <SelectFilter value={sort} onChange={(v) => { setSort(v); setPage(0) }} options={SORTS} />
          {totalElements > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '0.25rem' }}>
              {totalElements} church{totalElements !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </div>

      {isLoading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '0.875rem',
        }}>
          {Array.from({ length: 6 }, (_, i) => <Skeleton.Card key={i} />)}
        </div>
      )}

      {!isLoading && churches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--color-bg)', margin: '0 auto 0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)',
          }}>
            <IconChurch />
          </div>
          {query ? 'No churches match your search' : 'No churches found'}
        </div>
      )}

      {!isLoading && churches.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.875rem',
          }}>
            {churches.map((church) => {
              const parent = parentName(church)
              const pastorCount = church.pastors?.length ?? 0
              const elderCount = church.elders?.length ?? 0
              const deaconCount = church.deacons?.length ?? 0
              return (
                <div
                  key={church.id}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    padding: '1rem 1.125rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 25%, var(--color-border))'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                  }}
                  onClick={() => navigate(`/churches/${church.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 44, height: 44, borderRadius: 10,
                      background: 'linear-gradient(135deg, var(--color-primary), #5c0e0e)',
                      color: '#fff', fontSize: '1.125rem', fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {(church.name || '')[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{church.name}</span>
                        {adminStatusMap.get(church.id) && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.1875rem',
                            padding: '0.0625rem 0.375rem', borderRadius: 999,
                            fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                            color: 'var(--color-accent)',
                            flexShrink: 0,
                          }}>
                            <IconShield /> Admin
                          </span>
                        )}
                      </div>
                      {church.address && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          fontSize: '0.75rem', color: 'var(--color-text-secondary)',
                        }}>
                          <IconMapPin /> {church.address}
                        </div>
                      )}
                      {parent && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          fontSize: '0.75rem', color: 'var(--color-text-muted)',
                          marginTop: '0.125rem',
                        }}>
                          <IconHierarchy /> Sub of {parent}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginTop: '0.75rem', paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)',
                  }}>
                    {(pastorCount > 0 || elderCount > 0 || deaconCount > 0) ? (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {pastorCount > 0 && (
                          <span style={{
                            padding: '0.125rem 0.4375rem', borderRadius: 999,
                            fontSize: '0.625rem', fontWeight: 600,
                            background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
                            color: 'var(--color-primary)',
                            border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)',
                          }}>
                            {pastorCount} pastor{pastorCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {elderCount > 0 && (
                          <span style={{
                            padding: '0.125rem 0.4375rem', borderRadius: 999,
                            fontSize: '0.625rem', fontWeight: 600,
                            background: 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid color-mix(in srgb, var(--color-text-muted) 15%, transparent)',
                          }}>
                            {elderCount} elder{elderCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {deaconCount > 0 && (
                          <span style={{
                            padding: '0.125rem 0.4375rem', borderRadius: 999,
                            fontSize: '0.625rem', fontWeight: 600,
                            background: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
                            color: 'var(--color-success)',
                            border: '1px solid color-mix(in srgb, var(--color-success) 15%, transparent)',
                          }}>
                            {deaconCount} deacon{deaconCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No leadership assigned
                      </span>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.125rem' }}>
                      {canRead && (
                        <button
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, border: 'none', borderRadius: 6,
                            background: 'transparent', color: 'var(--color-text-muted)',
                            cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/churches/${church.id}`) }}
                          title="View"
                        >
                          <IconEye />
                        </button>
                      )}
                      {canUpdate && (
                        <button
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, border: 'none', borderRadius: 6,
                            background: 'transparent', color: 'var(--color-text-muted)',
                            cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                          onClick={(e) => { e.stopPropagation(); openEdit(church) }}
                          title="Edit"
                        >
                          <IconEdit />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, border: 'none', borderRadius: 6,
                            background: 'transparent', color: 'var(--color-text-muted)',
                            cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-error) 10%, transparent)'; e.currentTarget.style.color = 'var(--color-error)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(church) }}
                          title="Delete"
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pagination pagination-right" style={{ marginTop: '1.25rem' }}>
            <button className="btn btn-sm btn-outline" disabled={totalPages <= 1 || safePage === 0} onClick={() => setPage(0)}>«</button>
            <button className="btn btn-sm btn-outline" disabled={totalPages <= 1 || safePage === 0} onClick={() => setPage(safePage - 1)}>‹</button>
            {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i)
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

      {showForm && (
        <div className="mf-overlay" onClick={() => { setShowForm(false); setEditTarget(null) }}>
          <div className="mf-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mf-header">
              <div className="mf-header-icon"><IconChurch /></div>
              <div className="mf-header-text">
                <h3 className="mf-header-title">{editTarget ? 'Edit Church' : t('churches.createChurch')}</h3>
                <p className="mf-header-sub">{editTarget ? 'Update church information' : 'Add a new church to the system'}</p>
              </div>
              <button className="mf-close" onClick={() => { setShowForm(false); setEditTarget(null) }}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mf-body">
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconChurch /> Church Details</h4>
                  <div className="mf-grid">
                    <div className="mf-field">
                      <label className="mf-label">{t('churches.name')} <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconChurch /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="mf-field full">
                      <label className="mf-label">{t('churches.address')} <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconMapPin /></span>
                        <textarea className="mf-input" style={{ paddingLeft: '2.25rem', resize: 'vertical' }} value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} rows={2} required />
                      </div>
                    </div>
                    <div className="mf-field full">
                      <label className="mf-label">{t('churches.parentChurch')}</label>
                      <SearchableSelect
                        options={allChurches.map((c) => ({ id: c.id, label: c.name }))}
                        value={form.parentChurchId}
                        onChange={(id) => setForm((prev) => ({ ...prev, parentChurchId: id }))}
                        placeholder="Search parent church..."
                        excludeIds={editTarget ? new Set([editTarget.id]) : undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mf-footer">
                <button type="button" className="mf-btn mf-btn-cancel" onClick={() => { setShowForm(false); setEditTarget(null) }}><IconX /> {t('common.cancel')}</button>
                <button type="submit" className="mf-btn mf-btn-save" disabled={updateMut.isPending || createMut.isPending}>
                  {(updateMut.isPending || createMut.isPending) && <span className="mf-spinner" />}
                  {updateMut.isPending || createMut.isPending ? 'Saving...' : <><IconCheck /> {t('common.save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('churches.confirmDelete')}
        message={t('churches.deleteWarning')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}
