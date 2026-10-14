import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { useAuth } from '../context/AuthContext'
import { useChurch, useUpdateChurch, useSubChurches } from '../hooks/useChurches'
import { useChurchMembers } from '../hooks/usePeople'
import { unwrap } from '../hooks/useApi'
import { type PositionHolder, type Church, type Person, peopleApi, ChurchRequest } from '../services/api'
import Skeleton from '../shared/components/Skeleton'

// ─── Inline SVG icons ───

const IconChevron = ({ open }: { open: boolean }) => (
  <svg className={`cd-card-chevron${open ? ' is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
)
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconUserPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
)
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
)
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)

// ─── Collapsible card ───

function CollapsibleCard({ title, count, defaultOpen = false, onAdd, children }: { title: string; count: number; defaultOpen?: boolean; onAdd?: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`cd-card${open ? ' is-open' : ''}`}>
      <header className="cd-card-header" onClick={() => setOpen(!open)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open) } }}>
        <IconChevron open={open} />
        <h2 className="cd-card-title">{title}</h2>
        <span className="cd-card-badge">{count}</span>
        {onAdd && (
          <button className="cd-add-btn" onClick={(e) => { e.stopPropagation(); onAdd() }} title={`Assign ${title}`}>
            <IconSearch />
          </button>
        )}
      </header>
      <div className="cd-card-body">{children}</div>
    </section>
  )
}

// ─── Searchable table with actions ───

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
}

interface Action<T> {
  label: string
  icon: React.ReactNode
  onClick: (item: T) => void
}

function SearchableTable<T extends Record<string, any>>({
  data,
  columns,
  searchKeys,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No data',
  pageSize = 8,
  actions,
}: {
  data: T[]
  columns: Column<T>[]
  searchKeys: (keyof T)[]
  searchPlaceholder?: string
  emptyMessage?: string
  pageSize?: number
  actions?: Action<T>[]
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const safeData = Array.isArray(data) ? data : [];
  const filtered = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase()
      return safeData.filter((item) =>
        searchKeys.some((key) => {
          const val = item[key]
          return val != null && String(val).toLowerCase().includes(q)
        }),
      )
    }
    return safeData
  }, [safeData, query, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize)
  const colCount = columns.length + (actions ? 1 : 0)

  return (
    <div className="st-table">
      <div className="st-search">
        <IconSearch />
        <input className="st-search-input" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} />
        {query && <button className="st-search-clear" onClick={() => setQuery('')} tabIndex={-1}><IconX /></button>}
      </div>
      <div className="st-scroll">
        <table className="st-grid">
          <thead>
            <tr>
              {columns.map((col) => <th key={col.key}>{col.header}</th>)}
              {actions && <th className="st-actions-th">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={colCount} className="st-empty">{emptyMessage}</td></tr>
            )}
            {paged.map((item, i) => (
              <tr key={(item as any).id ?? i}>
                {columns.map((col) => <td key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? '—')}</td>)}
                {actions && (
                  <td className="st-actions-td">
                    <div className="table-actions">
                      {actions.map((a) => (
                        <button key={a.label} className="table-action-btn" onClick={() => a.onClick(item)} title={a.label}>
                          {a.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="st-footer">
        <span className="st-count">{filtered.length} of {data.length}</span>
        <div className="st-pagination">
          <button className="st-page-btn" disabled={totalPages <= 1 || safePage === 0} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i)
            .filter((i) => totalPages <= 1 || i === 0 || i === totalPages - 1 || Math.abs(i - safePage) <= 1)
            .map((i, idx, arr) => (
              <span key={i} style={{ display: 'contents' }}>
                {totalPages > 1 && idx > 0 && arr[idx - 1] !== i - 1 && <span className="st-page-ellipsis">…</span>}
                <button className={`st-page-btn${i === safePage ? ' st-page-btn--active' : ''}`} disabled={totalPages <= 1} onClick={() => setPage(i)}>{i + 1}</button>
              </span>
            ))}
          <button className="st-page-btn" disabled={totalPages <= 1 || safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign-person modal (filter + search + paginated table) ───

const PAGE_SIZE = 6

function AssignPersonModal({
  title,
  excludeIds,
  onAssign,
  onClose,
}: {
  title: string
  excludeIds: Set<number>
  onAssign: (person: Person) => void
  onClose: () => void
}) {
  const [filters, setFilters] = useState({ name: '', email: '', phone: '' })
  const [results, setResults] = useState<Person[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  function setFilter(field: string, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    setSearching(true)
    setPage(0)
    try {
      const trimmed = Object.fromEntries(
        Object.entries(filters).map(([k, v]) => [k, v.trim()]),
      ) as typeof filters
      const searchStr = [trimmed.name, trimmed.email, trimmed.phone].filter(Boolean).join(' ')
      const data = await unwrap(peopleApi.list({ search: searchStr || undefined }))
      const peopleList = 'content' in data ? data.content : data
      setResults(peopleList.filter((p) => !excludeIds.has(Number(p.id))))
      setSearched(true)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = results.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  async function handleAssign(person: Person) {
    setAssigning(person.id)
    try {
      await onAssign(person)
      showSuccessToast(`${person.firstName} ${person.lastName} assigned`)
      onClose()
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Failed to assign')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog-lg" onClick={(e) => e.stopPropagation()}>
        <h3>Assign {title}</h3>

        <form onSubmit={handleSearch} className="assign-filters">
          <div className="assign-filters-row">
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={filters.name} onChange={(e) => setFilter('name', e.target.value)} placeholder="Filter by name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="text" value={filters.email} onChange={(e) => setFilter('email', e.target.value)} placeholder="Filter by email" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={filters.phone} onChange={(e) => setFilter('phone', e.target.value)} placeholder="Filter by phone" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? '…' : <><IconSearch /> Search</>}
          </button>
        </form>

        <div className="assign-results-wrapper">
          {!searched ? (
            <p className="assign-hint">Enter search criteria above and click Search to find people.</p>
          ) : paged.length === 0 ? (
            <p className="st-empty" style={{ padding: '1rem 0' }}>No matching people found</p>
          ) : (
            <table className="st-grid assign-results-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="st-actions-th" style={{ width: '6rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => (
                  <tr key={p.userId}>
                    <td>{p.firstName} {p.lastName}</td>
                    <td>{p.email || '—'}</td>
                    <td>{p.phoneNumber || '—'}</td>
                    <td className="st-actions-td">
                      <button className="btn btn-primary btn-sm" onClick={() => handleAssign(p)} disabled={assigning === p.id}>
                        {assigning === p.id ? '…' : <><IconUserPlus /> Assign</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {searched && results.length > 0 && (
          <div className="st-footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <span className="st-count">{results.length} total</span>
            <div className="st-pagination">
              <button className="st-page-btn" disabled={totalPages <= 1 || safePage === 0} onClick={() => setPage(safePage - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter((i) => totalPages <= 1 || i === 0 || i === totalPages - 1 || Math.abs(i - safePage) <= 1)
                .map((i, idx, arr) => (
                  <span key={i} style={{ display: 'contents' }}>
                    {totalPages > 1 && idx > 0 && arr[idx - 1] !== i - 1 && <span className="st-page-ellipsis">…</span>}
                    <button className={`st-page-btn${i === safePage ? ' st-page-btn--active' : ''}`} disabled={totalPages <= 1} onClick={() => setPage(i)}>{i + 1}</button>
                  </span>
                ))}
              <button className="st-page-btn" disabled={totalPages <= 1 || safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>›</button>
            </div>
          </div>
        )}

        <div className="dialog-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit position holder modal ───

function EditPositionModal({
  holder,
  onSave,
  onClose,
}: {
  holder: PositionHolder
  onSave: (updated: PositionHolder) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(holder.name)
  const [phoneNumber, setPhoneNumber] = useState(holder.phoneNumber ?? '')
  const [email, setEmail] = useState(holder.email ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { showErrorToast('Name is required'); return }
    setSaving(true)
    try {
      await onSave({ ...holder, name: name.trim(), phoneNumber: phoneNumber || undefined, email: email || undefined })
      showSuccessToast('Updated')
      onClose()
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Edit {holder.name}</h3>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '…' : <><IconCheck /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ───

type PositionKey = 'pastors' | 'elders' | 'deacons'

export default function ChurchDetail() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const churchId = id ? Number(id) : null

  const { data: church, isLoading: churchLoading } = useChurch(churchId)
  const { data: subChurches = [] } = useSubChurches(churchId)
  const updateMut = useUpdateChurch()

  const { data: membersPage } = useChurchMembers(churchId)
  const membersList = membersPage?.content ?? []
  const churchAdmin = useMemo(() => membersList.find((m) => m.admin), [membersList])

  const [assignTarget, setAssignTarget] = useState<PositionKey | null>(null)
  const [editHolder, setEditHolder] = useState<{ holder: PositionHolder; key: PositionKey } | null>(null)

  const buildUpdate = useCallback(
    (overrides: Partial<ChurchRequest>) => {
      if (!church) throw new Error('No church')
      return {
        name: church.name,
        address: church.address,
        parentChurchId: church.parentChurch?.id ?? church.parentChurchId ?? null,
        pastors: church.pastors,
        elders: church.elders,
        deacons: church.deacons,
        ...overrides,
      }
    },
    [church],
  )

  async function handleAssign(key: PositionKey, person: Person) {
    if (!church) return
    const holder: PositionHolder = {
      id: Number(person.id),
      name: `${person.firstName} ${person.lastName}`.trim(),
      phoneNumber: person.tel || person.phoneNumber,
      email: person.emailAddress || person.email,
    }
    await updateMut.mutateAsync({
      id: church.id,
      data: buildUpdate({ [key]: [...(church[key] ?? []), holder] }),
    })
  }

  async function handleEdit(key: PositionKey, updated: PositionHolder) {
    if (!church) return
    const arr = [...(church[key] ?? [])]
    const idx = arr.findIndex((h) => h.id === updated.id)
    if (idx !== -1) arr[idx] = updated
    await updateMut.mutateAsync({
      id: church.id,
      data: buildUpdate({ [key]: arr }),
    })
  }

  async function handleRemove(key: PositionKey, holder: PositionHolder) {
    if (!window.confirm(`Remove ${holder.name} from ${key}?`)) return
    if (!church) return
    const arr = (church[key] ?? []).filter((h) => h.id !== holder.id)
    await updateMut.mutateAsync({
      id: church.id,
      data: buildUpdate({ [key]: arr }),
    })
    showSuccessToast(`${holder.name} removed`)
  }

  const positionExcludeIds = useMemo(() => {
    if (!assignTarget || !church) return new Set<number>()
    return new Set((church[assignTarget] ?? []).map((h) => h.id).filter(Boolean))
  }, [assignTarget, church])

  if (churchLoading) {
    return (
      <div className="cd-page">
        <div style={{ padding: '1.5rem' }}>
          <Skeleton.Card rows={2} />
          <div style={{ marginTop: '1.5rem' }}>
            <Skeleton.Table rows={4} cols={4} />
          </div>
        </div>
      </div>
    )
  }

  if (!church) {
    return (
      <div className="cd-page">
        <div className="cd-empty">
          <h2>{t('churches.notFound')}</h2>
          <button className="btn btn-outline" onClick={() => navigate('/churches')}>
            <IconArrowLeft /> {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  const c = church

  function parentName(): string {
    if (c.parentChurch) return c.parentChurch.name
    if (c.parentChurchId) return `#${c.parentChurchId}`
    return '—'
  }

  const positionPerms: Record<PositionKey, string> = {
    pastors: 'can_read_pastor',
    elders: 'can_read_elders',
    deacons: 'can_read_deacons',
  }

  const visiblePositions = (['pastors', 'elders', 'deacons'] as const).filter(
    (key) => user?.permissions?.includes(positionPerms[key]),
  )

  function renderActions(key: PositionKey): Action<PositionHolder>[] {
    return [
      {
        label: 'Edit',
        icon: <IconEdit />,
        onClick: (holder) => setEditHolder({ holder, key }),
      },
      {
        label: 'Remove',
        icon: <IconTrash />,
        onClick: (holder) => handleRemove(key, holder),
      },
    ]
  }

  const nameCol: Column<PositionHolder> = { key: 'name', header: 'Name' }
  const phoneCol: Column<PositionHolder> = { key: 'phoneNumber', header: 'Phone' }
  const emailCol: Column<PositionHolder> = { key: 'email', header: 'Email' }

  const childChurchCols: Column<Church>[] = [
    { key: 'id', header: '#' },
    { key: 'name', header: 'Name' },
    { key: 'address', header: 'Address' },
  ]

  const childChurchActions: Action<Church>[] = [
    {
      label: 'View',
      icon: <IconEye />,
      onClick: (church) => navigate(`/churches/${church.id}`),
    },
  ]

  return (
    <div className="cd-page">
      <nav className="cd-breadcrumb">
        <button className="cd-breadcrumb-link" onClick={() => navigate('/churches')}>
          <IconArrowLeft /> Churches
        </button>
        <span className="cd-breadcrumb-sep">/</span>
        <span className="cd-breadcrumb-current">{c.name}</span>
      </nav>

      <header className="cd-hero">
        <div className="cd-hero-top">
          <h1 className="cd-hero-title">{c.name}</h1>
          <span className="cd-hero-badge">#{c.id}</span>
          {churchAdmin && (
            <span className="cd-hero-admin-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin: {churchAdmin.firstName} {churchAdmin.lastName}
            </span>
          )}
        </div>
        <p className="cd-hero-address">{c.address}</p>
        <div className="cd-hero-meta">
          <div className="cd-hero-meta-item">
            <span className="cd-hero-meta-label">Parent Church</span>
            <span className="cd-hero-meta-value">{parentName()}</span>
          </div>
          <div className="cd-hero-meta-item">
            <span className="cd-hero-meta-label">Members</span>
            <span className="cd-hero-meta-value">{membersList.length}</span>
          </div>
          <div className="cd-hero-meta-item">
            <span className="cd-hero-meta-label">Sub Churches</span>
            <span className="cd-hero-meta-value">{subChurches.length}</span>
          </div>
        </div>
      </header>

      <div className="cd-tables">
        {visiblePositions.map((key) => (
          <CollapsibleCard key={key} title={key.charAt(0).toUpperCase() + key.slice(1)} count={c[key]?.length ?? 0} onAdd={() => setAssignTarget(key)}>
            <SearchableTable
              data={c[key] ?? []}
              columns={[nameCol, phoneCol, emailCol]}
              searchKeys={['name', 'phoneNumber', 'email']}
              searchPlaceholder={`Search ${key}…`}
              emptyMessage={`No ${key.slice(0, -1)} assigned`}
              actions={renderActions(key)}
            />
          </CollapsibleCard>
        ))}

        {user?.permissions?.includes('can_read_church') && (
        <CollapsibleCard title="Sub Churches" count={subChurches.length}>
          <SearchableTable
            data={subChurches}
            columns={childChurchCols}
            searchKeys={['name', 'address']}
            searchPlaceholder="Search sub churches…"
            emptyMessage="No sub churches"
            actions={childChurchActions}
          />
        </CollapsibleCard>
        )}

        {user?.permissions?.includes('can_read_members') && (
        <CollapsibleCard title="Members" count={membersList.length}>
          <SearchableTable
            data={membersList}
            columns={[
              { key: 'name', header: 'Name', render: (p: Person) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                  <span className="crud-avatar-sm">{p.firstName?.charAt(0)}{p.lastName?.charAt(0)}</span>
                  {p.firstName} {p.lastName}
                </span>
              )},
              { key: 'emailAddress', header: 'Email', render: (p: Person) => p.emailAddress || '—' },
              { key: 'tel', header: 'Phone', render: (p: Person) => p.tel || '—' },
              { key: 'gender', header: 'Gender', render: (p: Person) => (
                <span className="crud-gender">{p.gender}</span>
              )},
              { key: 'status', header: 'Status', render: (p: Person) => (
                <span className={`status-badge ${(p.isBaptised ?? p.baptised) ? 'status-active' : 'status-inactive'}`}>
                  {(p.isBaptised ?? p.baptised) ? 'Communicant Member' : 'Non Communicant Member'}
                </span>
              )},
            ]}
            searchKeys={['firstName', 'lastName', 'emailAddress', 'tel']}
            searchPlaceholder="Search members…"
            emptyMessage="No members in this church"
            pageSize={10}
            actions={[
              { label: 'View', icon: <IconEye />, onClick: (p: Person) => navigate(`/members/${p.id}`) },
            ]}
          />
        </CollapsibleCard>
        )}
      </div>

      {assignTarget && (
        <AssignPersonModal
          title={assignTarget.charAt(0).toUpperCase() + assignTarget.slice(1)}
          excludeIds={positionExcludeIds}
          onAssign={(person) => handleAssign(assignTarget, person)}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {editHolder && (
        <EditPositionModal
          holder={editHolder.holder}
          onSave={(updated) => handleEdit(editHolder.key, updated)}
          onClose={() => setEditHolder(null)}
        />
      )}
    </div>
  )
}
