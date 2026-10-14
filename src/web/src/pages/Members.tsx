import { useState, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { usePeopleList, useCreatePerson, useUpdatePerson, useDeletePerson, useMakeChurchAdmin } from '../hooks/usePeople'
import { useAllChurches } from '../hooks/useChurches'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import Skeleton from '../shared/components/Skeleton'
import type { Person } from '../services/api'

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
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconEmail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
)
const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
)
const IconMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
)
const IconChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
)
const IconArrowUpDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconShield = ({ filled }: { filled?: boolean }) => filled
  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IconCross = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" strokeWidth="3"/></svg>
)
const IconChurch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)

const PAGE_SIZE = 12

interface FormData {
  firstName: string; lastName: string; middleName: string; emailAddress: string; tel: string
  gender: string; address: string; isBaptised: boolean; churchId: string
  serialNumber: string; dateOfBaptism: string; worshipCenter: string
  bibleVerse: string; baptisedBy: string; remark: string
}
const emptyForm: FormData = {
  firstName: '', lastName: '', middleName: '', emailAddress: '', tel: '',
  gender: 'Female', address: '', isBaptised: false, churchId: '',
  serialNumber: '', dateOfBaptism: '', worshipCenter: '',
  bibleVerse: '', baptisedBy: '', remark: '',
}

function getBaptised(p: Person) {
  return p.baptised ?? p.isBaptised ?? false
}

const GENDERS = ['', 'Male', 'Female'] as const
const STATUSES = ['', 'Communicant', 'Non-communicant'] as const
const SORTS = [
  { value: '', label: 'Default' },
  { value: 'firstName,asc', label: 'Name A\u2013Z' },
  { value: 'firstName,desc', label: 'Name Z\u2013A' },
  { value: 'dateOfBirth,asc', label: 'Age \u2191' },
  { value: 'dateOfBirth,desc', label: 'Age \u2193' },
]

function SelectFilter({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void
  options: readonly string[] | { value: string; label: string }[]
  placeholder?: string
}) {
  const items = Array.isArray(options) && typeof options[0] === 'string'
    ? (options as readonly string[]).map((o) => ({ value: o, label: o || placeholder || 'All' }))
    : (options as { value: string; label: string }[])
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
        {items.map((opt) => (
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

export default function Members() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const allPerms = (user?.permissions ?? []).map((p) => p.toLowerCase())
  const canCreate = allPerms.includes('can_create_members')
  const canUpdate = allPerms.includes('can_update_members')
  const canDelete = allPerms.includes('can_delete_members')
  const canMakeAdmin = allPerms.includes('can_update_church') && allPerms.includes('can_update_members')

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [position, setPosition] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('')

  const { data: pageResponse, isLoading } = usePeopleList({
    search: query || undefined,
    position: position || undefined,
    sort: sort || undefined,
    page,
    size: PAGE_SIZE,
  })

  const serverData = pageResponse?.content ?? []
  const totalPages = pageResponse?.totalPages ?? 1
  const totalElements = pageResponse?.totalElements ?? 0

  const filtered = useMemo(() => {
    let items = serverData
    if (genderFilter) {
      items = items.filter((p) => p.gender?.toLowerCase() === genderFilter.toLowerCase())
    }
    if (statusFilter) {
      const wantCommunicant = statusFilter === 'Communicant'
      items = items.filter((p) => {
        const b = getBaptised(p)
        return wantCommunicant ? b : !b
      })
    }
    return items
  }, [serverData, genderFilter, statusFilter])

  const churchHasAdmin = useMemo(() => {
    const map = new Map<number, boolean>()
    for (const p of serverData) {
      if (p.admin && p.church?.id) map.set(p.church.id, true)
    }
    return map
  }, [serverData])

  const createMut = useCreatePerson()
  const updateMut = useUpdatePerson()
  const deleteMut = useDeletePerson()
  const makeAdminMut = useMakeChurchAdmin()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  const [adminTarget, setAdminTarget] = useState<Person | null>(null)

  const { data: churchesData } = useAllChurches(200, showForm)
  const churches = churchesData?.content ?? []

  function openCreate() { setEditing(null); setForm(emptyForm); setShowForm(true) }
  function openEdit(p: Person) {
    const rec = p.baptismRecord
    setEditing(p)
    setForm({
      firstName: p.firstName, lastName: p.lastName, middleName: p.middleName || '',
      emailAddress: p.emailAddress || '', tel: p.tel || '',
      gender: p.gender, address: p.address || '',
      isBaptised: getBaptised(p), churchId: p.church?.id ? String(p.church.id) : '',
      serialNumber: rec?.serialNumber ? String(rec.serialNumber) : '',
      dateOfBaptism: rec?.dateOfBaptism || '',
      worshipCenter: rec?.worshipCenter || '',
      bibleVerse: rec?.bibleVerse || '',
      baptisedBy: rec?.baptizedBy || '',
      remark: rec?.remark || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error('Name is required'); return }
    if (!form.tel.trim()) { toast.error('Phone number is required'); return }
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName, lastName: form.lastName, middleName: form.middleName || null,
        emailAddress: form.emailAddress, tel: form.tel, gender: form.gender,
        address: form.address, isBaptised: form.isBaptised,
        churchId: form.churchId ? Number(form.churchId) : null,
      }
      if (form.isBaptised) {
        payload.serialNumber = form.serialNumber ? Number(form.serialNumber) : null
        payload.dateOfBaptism = form.dateOfBaptism || null
        payload.worshipCenter = form.worshipCenter || null
        payload.bibleVerse = form.bibleVerse || null
        payload.baptisedBy = form.baptisedBy || null
        payload.remark = form.remark || null
      }
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, data: payload as Partial<Person> })
        toast.success(t('members.updateSuccess'))
      } else {
        await createMut.mutateAsync(payload as Partial<Person>)
        toast.success(t('members.createSuccess'))
      }
      setShowForm(false)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Operation failed') }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success(t('members.deleteSuccess'))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleMakeAdmin() {
    if (!adminTarget) return
    const name = [adminTarget.firstName, adminTarget.lastName].filter(Boolean).join(' ')
    try {
      await makeAdminMut.mutateAsync(adminTarget.id)
      toast.success(`${name} is now church admin`)
      setAdminTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  function handleSearch(val: string) {
    setQuery(val)
    setPage(0)
  }

  const safePage = Math.min(page, totalPages - 1)
  const hasServerFilters = !!(query || position)
  const hasClientFilters = !!(genderFilter || statusFilter)
  const hasAnyFilter = hasServerFilters || hasClientFilters

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t('members.title')}</h2>
          <p className="page-subtitle">{t('members.description')}</p>
        </div>
        {canCreate && (
          <button className="btn btn-create" onClick={openCreate}><IconPlus /> {t('members.addMember')}</button>
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
            placeholder="Search by name, email or phone"
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
        <SelectFilter value={position} onChange={(v) => { setPosition(v); setPage(0) }} options={['', 'Pastor', 'Elder', 'Deacon']} placeholder="Position" />
        <SelectFilter value={genderFilter} onChange={setGenderFilter} options={GENDERS} placeholder="Gender" />
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={STATUSES} placeholder="Status" />
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          marginLeft: 'auto',
        }}>
          {hasAnyFilter && (
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
              onClick={() => { setPosition(''); setGenderFilter(''); setStatusFilter(''); setQuery(''); setPage(0) }}
            >
              <IconX /> Clear
            </button>
          )}
          <SelectFilter value={sort} onChange={(v) => { setSort(v); setPage(0) }} options={SORTS} placeholder="Sort" />
          {totalElements > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '0.25rem' }}>
              {filtered.length} of {totalElements}
            </span>
          )}
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '0 0 1rem' }}>
          <Skeleton.Table rows={5} cols={5} />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--color-bg)', margin: '0 auto 0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)',
          }}>
            <IconUser />
          </div>
          {hasAnyFilter ? 'No members match your filters' : 'No members found'}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          <div className="settings-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Church</th>
                  <th>Status</th>
                  <th className="settings-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const baptised = getBaptised(p)
                  const initials = `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase()
                  const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')
                  const churchName = p.church?.name
                  const isAdmin = p.admin === true
                  const churchAlreadyHasAdmin = !isAdmin && !!p.church?.id && churchHasAdmin.get(p.church.id)
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/members/${p.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 34, height: 34, borderRadius: '50%',
                            background: isAdmin
                              ? 'linear-gradient(135deg, var(--color-accent), #b45309)'
                              : 'linear-gradient(135deg, var(--color-primary), #5c0e0e)',
                            color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                            flexShrink: 0,
                            boxShadow: isAdmin ? '0 0 0 2px var(--color-surface), 0 0 0 3.5px var(--color-accent)' : undefined,
                          }}>
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</span>
                              {isAdmin && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.1875rem',
                                  padding: '0.0625rem 0.4375rem', borderRadius: 999,
                                  fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                                  background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                                  color: 'var(--color-accent)',
                                  flexShrink: 0,
                                }}>
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>
                                  Admin
                                </span>
                              )}
                            </div>
                            {p.emailAddress && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.emailAddress}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{p.tel || '—'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{churchName || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.125rem 0.5rem', borderRadius: 999,
                          fontSize: '0.6875rem', fontWeight: 600,
                          background: baptised
                            ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                            : 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                          color: baptised ? 'var(--color-success)' : 'var(--color-text-muted)',
                        }}>
                          <span style={{
                            display: 'inline-block', width: 4, height: 4, borderRadius: '50%',
                            background: baptised ? 'var(--color-success)' : 'var(--color-text-muted)',
                          }} />
                          {baptised ? 'Communicant' : 'Non-communicant'}
                        </span>
                      </td>
                      <td className="settings-td-actions">
                        <div className="btn-icon-group">
                          <button className="btn-icon" data-tooltip="View" onClick={(e) => { e.stopPropagation(); navigate(`/members/${p.id}`) }}>
                            <IconEye />
                          </button>
                          {canUpdate && (
                            <button className="btn-icon" data-tooltip="Edit" onClick={(e) => { e.stopPropagation(); openEdit(p) }}>
                              <IconEdit />
                            </button>
                          )}
                          {canMakeAdmin && p.church?.id && (
                            <button
                              className="btn-icon"
                              data-tooltip={isAdmin ? 'Church admin' : 'Make admin'}
                              style={{
                                color: isAdmin
                                  ? 'var(--color-success)'
                                  : churchAlreadyHasAdmin
                                    ? 'var(--color-accent)'
                                    : 'var(--color-accent)',
                              }}
                              disabled={isAdmin || makeAdminMut.isPending}
                              onClick={(e) => {
                                e.stopPropagation()
                                setAdminTarget(p)
                              }}
                            >
                              <IconShield filled={isAdmin} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-icon btn-icon-danger"
                              data-tooltip="Delete"
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

      {showForm && (
        <div className="mf-overlay" onClick={() => setShowForm(false)}>
          <div className="mf-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mf-header">
              <div className="mf-header-icon"><IconUser /></div>
              <div className="mf-header-text">
                <h3 className="mf-header-title">{editing ? t('members.editMember') : t('members.addMember')}</h3>
                <p className="mf-header-sub">{editing ? 'Update member information' : 'Add a new member to the church'}</p>
              </div>
              <button className="mf-close" onClick={() => setShowForm(false)}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mf-body">
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconUser /> Personal Information</h4>
                  <div className="mf-grid">
                    <div className="mf-field">
                      <label className="mf-label">{t('members.firstName')} <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconUser /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">{t('members.lastName')} <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconUser /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">Middle Name</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconUser /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
                      </div>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">{t('members.gender')}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconUser /></span>
                        <select className="mf-input" style={{ paddingLeft: '2.25rem' }} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="mf-field full">
                      <label className="mf-label">Address</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconMapPin /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconEmail /> Contact</h4>
                  <div className="mf-grid">
                    <div className="mf-field">
                      <label className="mf-label">{t('members.email')}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconEmail /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} type="email" value={form.emailAddress} onChange={(e) => setForm({ ...form, emailAddress: e.target.value })} />
                      </div>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">{t('members.phone')}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconPhone /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} type="tel" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} required />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconChurch /> Church</h4>
                  <div className="mf-grid">
                    <div className="mf-field full">
                      <label className="mf-label">Church</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconChurch /></span>
                        <select className="mf-input" style={{ paddingLeft: '2.25rem' }} value={form.churchId} onChange={(e) => setForm({ ...form, churchId: e.target.value })}>
                          <option value="">Select a church</option>
                          {churches.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {editing && canMakeAdmin && form.churchId && (
                      <div className="mf-field full">
                        {editing.admin ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            borderRadius: 10, width: '100%',
                            background: 'color-mix(in srgb, var(--color-success) 8%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--color-success) 20%, transparent)',
                            color: 'var(--color-success)',
                            fontSize: '0.8125rem', fontWeight: 600,
                          }}>
                            <IconShield filled />
                            Church Admin
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => {
                              setShowForm(false)
                              setAdminTarget(editing)
                            }}
                          >
                            <IconShield />
                            Make Church Admin
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconCross /> Baptism</h4>
                  <div className="mf-toggle-wrap">
                    <label className="mf-toggle">
                      <input type="checkbox" checked={form.isBaptised} onChange={(e) => setForm({ ...form, isBaptised: e.target.checked })} />
                      <span className="mf-toggle-slider" />
                    </label>
                    <span className="mf-toggle-label">Baptised</span>
                    <span className="mf-toggle-hint">{form.isBaptised ? 'Communicant Member' : 'Non-Communicant Member'}</span>
                  </div>
                  {form.isBaptised && (
                    <div style={{ marginTop: '1rem' }}>
                      <h4 className="mf-section-title" style={{ fontSize: '0.8125rem' }}>Baptism Details</h4>
                      <div className="mf-grid">
                        <div className="mf-field">
                          <label className="mf-label">Serial Number <span className="required">*</span></label>
                          <input className="mf-input" type="number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Date of Baptism <span className="required">*</span></label>
                          <input className="mf-input" type="date" value={form.dateOfBaptism} onChange={(e) => setForm({ ...form, dateOfBaptism: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Worship Center <span className="required">*</span></label>
                          <input className="mf-input" value={form.worshipCenter} onChange={(e) => setForm({ ...form, worshipCenter: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Bible Verse <span className="required">*</span></label>
                          <input className="mf-input" value={form.bibleVerse} onChange={(e) => setForm({ ...form, bibleVerse: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Baptised By <span className="required">*</span></label>
                          <input className="mf-input" value={form.baptisedBy} onChange={(e) => setForm({ ...form, baptisedBy: e.target.value })} />
                        </div>
                        <div className="mf-field full">
                          <label className="mf-label">Remark</label>
                          <textarea className="mf-input" rows={2} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mf-footer">
                <button type="button" className="mf-btn mf-btn-cancel" onClick={() => setShowForm(false)}><IconX /> {t('common.cancel')}</button>
                <button type="submit" className="mf-btn mf-btn-save" disabled={createMut.isPending || updateMut.isPending}>
                  {(createMut.isPending || updateMut.isPending) && <span className="mf-spinner" />}
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : <><IconCheck /> {t('common.save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('members.confirmDelete')}
        message={t('members.deleteWarning')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
        loading={deleteMut.isPending}
      />

      <ConfirmDialog
        open={!!adminTarget}
        title="Make Church Admin"
        message={adminTarget
          ? adminTarget.admin
            ? `${[adminTarget.firstName, adminTarget.lastName].filter(Boolean).join(' ')} is already the admin of ${adminTarget.church?.name ?? 'their church'}.`
            : adminTarget.church?.id && churchHasAdmin.get(adminTarget.church.id)
              ? `${adminTarget.church?.name ?? 'This church'} already has an admin. This will replace the current admin with ${[adminTarget.firstName, adminTarget.lastName].filter(Boolean).join(' ')}.`
              : `Are you sure you want to make ${[adminTarget.firstName, adminTarget.lastName].filter(Boolean).join(' ')} the admin of ${adminTarget.church?.name ?? 'their church'}?`
          : ''}
        confirmLabel="Make Admin"
        onConfirm={handleMakeAdmin}
        onCancel={() => setAdminTarget(null)}
        loading={makeAdminMut.isPending}
      />
    </div>
  )
}
