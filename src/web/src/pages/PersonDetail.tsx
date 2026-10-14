import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { usePerson, useUpdatePerson, useDeletePerson, useMakeChurchAdmin, useDeacon, useElder, useUpdateDeacon, useDeleteDeacon, useUpdateElder, useDeleteElder } from '../hooks/usePeople'
import { useAllChurches } from '../hooks/useChurches'
import type { Person } from '../services/api'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import Skeleton from '../shared/components/Skeleton'

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
)
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
)
const IconChurch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)
const IconCross = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" strokeWidth="3"/></svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
)
const IconVenue = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
)
const IconBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
)

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function computeAge(dateStr?: string): number | null {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        <span style={{ color: 'var(--color-primary)', display: 'flex', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '0.75rem 1rem' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ padding: '0.375rem 0' }}>
      <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0.25rem 0' }} />
}

function Muted({ text }: { text: string }) {
  return <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontWeight: 400 }}>{text}</span>
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      padding: '0.125rem 0.5rem', borderRadius: 999,
      fontSize: '0.75rem', fontWeight: 600,
      background: active ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
      color: active ? 'var(--color-success)' : 'var(--color-text-muted)',
      border: `1px solid ${active ? 'color-mix(in srgb, var(--color-success) 20%, transparent)' : 'color-mix(in srgb, var(--color-text-muted) 15%, transparent)'}`,
    }}>
      <span style={{
        display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
        background: active ? 'var(--color-success)' : 'var(--color-text-muted)',
      }} />
      {label}
    </span>
  )
}

export default function PersonDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isDeacon = pathname.startsWith('/deacons/')
  const isElder = pathname.startsWith('/elders/')
  const backPath = isDeacon ? '/deacons' : isElder ? '/elders' : '/members'

  const personFromDeacon = useDeacon(isDeacon ? id : undefined)
  const personFromElder = useElder(isElder ? id : undefined)
  const personFromMember = usePerson(!isDeacon && !isElder ? id : undefined)

  const personResult = isDeacon ? personFromDeacon : isElder ? personFromElder : personFromMember
  const { data: person, isLoading } = personResult

  const entityLabel = isDeacon ? 'Deacon' : isElder ? 'Elder' : 'Member'
  const entityLabelPlural = isDeacon ? 'Deacons' : isElder ? 'Elders' : 'Members'

  const updateMut = isDeacon ? useUpdateDeacon() : isElder ? useUpdateElder() : useUpdatePerson()
  const deleteMut = isDeacon ? useDeleteDeacon() : isElder ? useDeleteElder() : useDeletePerson()
  const makeChurchAdminMut = useMakeChurchAdmin()

  const { data: churchesData } = useAllChurches()
  const churches = churchesData?.content ?? []

  const [deleteTarget, setDeleteTarget] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', middleName: '', gender: 'Male',
    emailAddress: '', tel: '',
    isBaptised: false, churchId: '',
    serialNumber: '', dateOfBaptism: '', worshipCenter: '',
    bibleVerse: '', baptisedBy: '', remark: '',
  })

  if (isLoading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
          <Skeleton width={80} height={14} />
        </div>
        <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', background: '#fff', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Skeleton.Circle size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="200px" height={22} style={{ marginBottom: '0.5rem' }} />
                <Skeleton width="120px" height={14} />
              </div>
            </div>
          </div>
        </div>
        <div className="person-detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton.Card rows={4} />
            <Skeleton.Card rows={3} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton.Card rows={3} />
            <Skeleton.Card rows={5} />
          </div>
        </div>
      </div>
    )
  }

  if (!person) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--color-bg)', margin: '0 auto 0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)',
          }}>
            <IconUser />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-text)' }}>
            Member not found
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            This member may have been removed or the link is incorrect.
          </p>
          <button className="btn btn-outline" onClick={() => navigate(backPath)}>
            <IconArrowLeft /> Back to {isDeacon ? 'Deacons' : isElder ? 'Elders' : 'Members'}
          </button>
        </div>
      </div>
    )
  }

  const baptised = person.baptised ?? person.isBaptised ?? false
  const initials = `${(person.firstName || '')[0] || ''}${(person.lastName || '')[0] || ''}`
  const fullName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ')
  const record = person.baptismRecord
  const age = computeAge(person.dateOfBirth)
  const contactEmail = person.emailAddress || person.email
  const contactPhone = person.tel || person.phoneNumber
  const church = person.church
  const churchName = church?.name
  const churchId = church?.id ?? null

  function openEdit() {
    if (!person) return
    const rec = person.baptismRecord
    setEditForm({
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName || '',
      gender: person.gender || 'Male',
      emailAddress: person.emailAddress || person.email || '',
      tel: person.tel || person.phoneNumber || '',
      isBaptised: person.baptised ?? person.isBaptised ?? false,
      churchId: person.church?.id ? String(person.church.id) : '',
      serialNumber: rec?.serialNumber ? String(rec.serialNumber) : '',
      dateOfBaptism: rec?.dateOfBaptism || '',
      worshipCenter: rec?.worshipCenter || '',
      bibleVerse: rec?.bibleVerse || '',
      baptisedBy: rec?.baptizedBy || '',
      remark: rec?.remark || '',
    })
    setShowEdit(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!person) return
    try {
      const payload: Record<string, unknown> = {
        firstName: editForm.firstName, lastName: editForm.lastName,
        middleName: editForm.middleName || null,
        gender: editForm.gender, isBaptised: editForm.isBaptised,
        churchId: editForm.churchId ? Number(editForm.churchId) : null,
      }
      if (editForm.isBaptised) {
        payload.serialNumber = editForm.serialNumber ? Number(editForm.serialNumber) : null
        payload.dateOfBaptism = editForm.dateOfBaptism || null
        payload.worshipCenter = editForm.worshipCenter || null
        payload.bibleVerse = editForm.bibleVerse || null
        payload.baptisedBy = editForm.baptisedBy || null
        payload.remark = editForm.remark || null
      }
      await updateMut.mutateAsync({ id: person.id, data: payload as Partial<Person> })
      toast.success(entityLabel + ' updated')
      setShowEdit(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update ' + entityLabel.toLowerCase())
    }
  }

  async function handleDelete() {
    if (!person) return
    try {
      await deleteMut.mutateAsync(String(person.id))
      toast.success(entityLabel + ' deleted')
      navigate(backPath, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete ' + entityLabel.toLowerCase())
    }
    setDeleteTarget(false)
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        marginBottom: '1.25rem', fontSize: '0.8125rem',
      }}>
        <button
          style={{
            border: 'none', background: 'none', padding: 0,
            color: 'var(--color-primary)', fontSize: 'inherit',
            fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          }}
          onClick={() => navigate(backPath)}
        >
          <IconArrowLeft /> {isDeacon ? 'Deacons' : isElder ? 'Elders' : 'Members'}
        </button>
        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{fullName}</span>
      </nav>

      <div style={{
        borderRadius: 10,
        border: '1px solid var(--color-border)',
        marginBottom: '1.5rem',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1.5rem',
          background: '#fff',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), #5c0e0e)',
              color: '#fff', fontSize: '1.25rem', fontWeight: 700,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(139,26,26,0.2)',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: '1.375rem', fontWeight: 700, margin: 0,
                color: 'var(--color-text)', lineHeight: 1.25,
              }}>
                {fullName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                <StatusBadge active label="Member" />
                {age !== null && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {age} years old
                  </span>
                )}
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {person.gender}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
              <button className="btn btn-outline btn-sm" onClick={openEdit}>
                <IconEdit /> Edit
              </button>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(true)}>
                <IconTrash /> Delete
              </button>
            </div>
          </div>
        </div>

        {(contactEmail || contactPhone || churchName) && (
          <div style={{
            display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
            padding: '0.625rem 1.5rem',
            background: 'var(--color-bg)',
          }}>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}><IconEmail /></span>
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}><IconPhone /></span>
                {contactPhone}
              </a>
            )}
            {churchName && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
              }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}><IconChurch /></span>
                {churchId ? (
                  <button
                    style={{
                      border: 'none', background: 'none', padding: 0,
                      color: 'var(--color-primary)', fontWeight: 500,
                      fontSize: 'inherit', cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/churches/${churchId}`)}
                  >
                    {churchName}
                  </button>
                ) : churchName}
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card icon={<IconUser />} title="Personal Information">
            <Field label="First name" value={person.firstName} />
            {person.middleName && <Field label="Middle name" value={person.middleName} />}
            <Field label="Last name" value={person.lastName} />
            <Divider />
            <Field label="Gender" value={person.gender} />
            {person.dateOfBirth && (
              <Field label="Date of birth" value={`${formatDate(person.dateOfBirth)} \u00B7 ${age} years`} />
            )}
          </Card>

          <Card icon={<IconMapPin />} title="Contact">
            <Field label="Email" value={contactEmail || <Muted text="Not provided" />} />
            <Field label="Phone" value={contactPhone || <Muted text="Not provided" />} />
            <Field label="Address" value={person.address || <Muted text="Not recorded" />} />
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card icon={<IconChurch />} title="Church Affiliation">
            {churchName ? (
              <>
                <Field
                  label="Church"
                  value={
                    churchId ? (
                      <button
                        style={{
                          border: 'none', background: 'none', padding: 0,
                          color: 'var(--color-primary)', fontWeight: 600,
                          fontSize: 'inherit', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        }}
                        onClick={() => navigate(`/churches/${churchId}`)}
                      >
                        {churchName}
                        <IconChevronRight />
                      </button>
                    ) : churchName
                  }
                />
                {church?.address && <Field label="Church address" value={church.address} />}
              </>
            ) : (
              <Field label="Church" value={<Muted text="Not assigned" />} />
            )}
            {person.position && <Field label="Position" value={person.position} />}
          </Card>

          <Card icon={<IconCross />} title="Baptism">
            <Field
              label="Status"
              value={<StatusBadge active={baptised} label={baptised ? 'Communicant' : 'Non-communicant'} />}
            />
            {record && (
              <>
                <Divider />
                {record.dateOfBaptism && (
                  <Field label="Date of baptism" value={formatDate(record.dateOfBaptism)!} />
                )}
                {record.serialNumber && (
                  <Field label="Serial number" value={`#${record.serialNumber}`} />
                )}
                {record.worshipCenter && (
                  <Field label="Worship center" value={record.worshipCenter} />
                )}
                {record.baptizedBy && (
                  <Field label="Baptised by" value={record.baptizedBy} />
                )}
                {record.bibleVerse && (
                  <Field label="Bible verse" value={record.bibleVerse} />
                )}
                {record.remark && (
                  <Field label="Remark" value={record.remark} />
                )}
              </>
            )}
            {!record && !baptised && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0.375rem 0' }}>
                No baptism record available
              </div>
            )}
          </Card>
        </div>
      </div>

      {showEdit && (
        <div className="mf-overlay" onClick={() => setShowEdit(false)}>
          <div className="mf-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mf-header">
              <div className="mf-header-icon"><IconUser /></div>
              <div className="mf-header-text">
                <h3 className="mf-header-title">Edit {entityLabel}</h3>
                <p className="mf-header-sub">Update {entityLabel.toLowerCase()} information</p>
              </div>
              <button className="mf-close" onClick={() => setShowEdit(false)}><IconClose /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="mf-body">
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconUser /> Personal Information</h4>
                  <div className="mf-grid">
                    <div className="mf-field">
                      <label className="mf-label">First Name <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconUser /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">Last Name <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconUser /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">Gender</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconUser /></span>
                        <select className="mf-input" style={{ paddingLeft: '2.25rem' }} value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconEmail /> Contact</h4>
                  <div className="mf-grid">
                    <div className="mf-field">
                      <label className="mf-label">Email</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconEmail /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} type="email" value={editForm.emailAddress} disabled />
                      </div>
                    </div>
                    <div className="mf-field">
                      <label className="mf-label">Phone <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}><IconPhone /></span>
                        <input className="mf-input" style={{ paddingLeft: '2.25rem' }} type="tel" value={editForm.tel} disabled />
                      </div>
                    </div>
                    <div className="mf-field full">
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
                        <select className="mf-input" style={{ paddingLeft: '2.25rem' }} value={editForm.churchId} onChange={(e) => setEditForm({ ...editForm, churchId: e.target.value })}>
                          <option value="">Select a church</option>
                          {churches.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {!isDeacon && !isElder && editForm.churchId && (
                      <div className="mf-field full">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                          disabled={makeChurchAdminMut.isPending}
                          onClick={async () => {
                            if (!person) return
                            try {
                              await makeChurchAdminMut.mutateAsync(String(person.id))
                              toast.success('Member is now church admin')
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Failed to make admin')
                            }
                          }}
                        >
                          {makeChurchAdminMut.isPending ? 'Setting admin...' : 'Make Church Admin'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mf-section">
                  <h4 className="mf-section-title"><IconCross /> Baptism</h4>
                  <div className="mf-toggle-wrap">
                    <label className="mf-toggle">
                      <input type="checkbox" checked={editForm.isBaptised} onChange={(e) => setEditForm({ ...editForm, isBaptised: e.target.checked })} />
                      <span className="mf-toggle-slider" />
                    </label>
                    <span className="mf-toggle-label">Baptised</span>
                    <span className="mf-toggle-hint">{editForm.isBaptised ? 'Communicant Member' : 'Non-Communicant Member'}</span>
                  </div>
                  {editForm.isBaptised && (
                    <div style={{ marginTop: '1rem' }}>
                      <h4 className="mf-section-title" style={{ fontSize: '0.8125rem' }}>Baptism Details</h4>
                      <div className="mf-grid">
                        <div className="mf-field">
                          <label className="mf-label">Serial Number <span className="required">*</span></label>
                          <input className="mf-input" type="number" value={editForm.serialNumber} onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Date of Baptism <span className="required">*</span></label>
                          <input className="mf-input" type="date" value={editForm.dateOfBaptism} onChange={(e) => setEditForm({ ...editForm, dateOfBaptism: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Worship Center <span className="required">*</span></label>
                          <input className="mf-input" value={editForm.worshipCenter} onChange={(e) => setEditForm({ ...editForm, worshipCenter: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Bible Verse <span className="required">*</span></label>
                          <input className="mf-input" value={editForm.bibleVerse} onChange={(e) => setEditForm({ ...editForm, bibleVerse: e.target.value })} />
                        </div>
                        <div className="mf-field">
                          <label className="mf-label">Baptised By <span className="required">*</span></label>
                          <input className="mf-input" value={editForm.baptisedBy} onChange={(e) => setEditForm({ ...editForm, baptisedBy: e.target.value })} />
                        </div>
                        <div className="mf-field full">
                          <label className="mf-label">Remark</label>
                          <textarea className="mf-input" rows={2} value={editForm.remark} onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}
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
        title={'Delete this ' + entityLabel.toLowerCase() + '?'}
        message={'This action cannot be undone. The ' + entityLabel.toLowerCase() + ' will be permanently removed from the system.'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(false)}
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}
