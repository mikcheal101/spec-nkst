import { useState, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { useAuth } from '../context/AuthContext'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useAuth'
import type { ProfileUpdateRequest } from '../services/api'
import LoadingSpinner from '../shared/components/LoadingSpinner'

const TABS = ['personalInfo', 'security'] as const
type Tab = (typeof TABS)[number]

const iconStyle: React.CSSProperties = {
  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
  color: 'var(--color-text-muted)', fontSize: '1rem', pointerEvents: 'none',
  lineHeight: 1,
}

const inputWrapStyle: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center',
}

function InputWrap({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div style={inputWrapStyle}>
      <span style={iconStyle}>{icon}</span>
      {children}
    </div>
  )
}

export default function Profile() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('personalInfo')
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updateProfileMut = useUpdateProfile()
  const changePwMut = useChangePassword()

  const [form, setForm] = useState<ProfileUpdateRequest>({
    firstName: '',
    lastName: '',
    middleName: '',
    tel: user?.phoneNumber || '',
    emailAddress: '',
  })
  const [dirty, setDirty] = useState(false)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        tel: profile.phoneNumber || user?.phoneNumber || '',
        emailAddress: profile.email || '',
      })
    }
  }, [profile, user])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setDirty(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updateProfileMut.mutateAsync(form)
      showSuccessToast(t('profile.updateSuccess'))
      setDirty(false)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    const { currentPassword, newPassword, confirmPassword } = pwForm
    if (newPassword !== confirmPassword) {
      showErrorToast(t('validation.passwordMismatch'))
      return
    }
    if (newPassword.length < 8) {
      showErrorToast(t('validation.passwordMinLength'))
      return
    }
    try {
      await changePwMut.mutateAsync({ currentPassword, newPassword })
      showSuccessToast(t('profile.passwordChanged'))
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Password change failed')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t('profile.title')}</h2>
          <p className="page-subtitle">{t('profile.description')}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', color: '#fff', fontWeight: 700,
            flexShrink: 0,
          }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{user?.username}</h3>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {user?.roles?.join(', ') || (user?.churchId ? t('profile.churchAdmin') : t('profile.superAdmin'))}
            </p>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((key) => (
            <button key={key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              {t(`profile.tab.${key}`)}
            </button>
          ))}
        </div>

        {tab === 'personalInfo' && (
          profileLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <LoadingSpinner size={36} />
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('members.firstName')}</label>
                  <InputWrap icon="👤">
                    <input name="firstName" value={form.firstName} onChange={handleChange} style={{ paddingLeft: '2.25rem', width: '100%' }} />
                  </InputWrap>
                </div>
                <div className="form-group">
                  <label>{t('members.lastName')}</label>
                  <InputWrap icon="👤">
                    <input name="lastName" value={form.lastName} onChange={handleChange} style={{ paddingLeft: '2.25rem', width: '100%' }} />
                  </InputWrap>
                </div>
              </div>
              <div className="form-group">
                <label>{t('members.middleName')}</label>
                <InputWrap icon="👤">
                  <input name="middleName" value={form.middleName} onChange={handleChange} style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </InputWrap>
              </div>
              <div className="form-group">
                <label>{t('members.email')}</label>
                <InputWrap icon="✉️">
                  <input name="emailAddress" type="email" value={form.emailAddress} onChange={handleChange} style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </InputWrap>
              </div>
              <div className="form-group">
                <label>{t('auth.phoneNumber')}</label>
                <InputWrap icon="📞">
                  <input name="tel" value={form.tel} onChange={handleChange} style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </InputWrap>
              </div>
              <div className="form-group">
                <label>{t('auth.username')}</label>
                <InputWrap icon="🔑">
                  <input value={user?.username || profile?.username || ''} disabled style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </InputWrap>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={updateProfileMut.isPending || !dirty}>
                  {updateProfileMut.isPending ? t('common.saving') : t('common.save')}
                </button>
                {dirty && (
                  <button type="button" className="btn btn-outline" onClick={() => { setDirty(false); setForm({ firstName: '', lastName: '', middleName: '', tel: user?.phoneNumber || '', emailAddress: '' }) }}>
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </form>
          )
        )}

        {tab === 'security' && (
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>{t('profile.currentPassword')}</label>
              <InputWrap icon="🔒">
                <input name="currentPassword" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required style={{ paddingLeft: '2.25rem', width: '100%' }} />
              </InputWrap>
            </div>
            <div className="form-group">
              <label>{t('profile.newPassword')}</label>
              <InputWrap icon="🔒">
                <input name="newPassword" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={8} style={{ paddingLeft: '2.25rem', width: '100%' }} />
              </InputWrap>
            </div>
            <div className="form-group">
              <label>{t('profile.confirmPassword')}</label>
              <InputWrap icon="🔒">
                <input name="confirmPassword" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required minLength={8} style={{ paddingLeft: '2.25rem', width: '100%' }} />
              </InputWrap>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={changePwMut.isPending}>
                {changePwMut.isPending ? t('common.saving') : t('profile.updatePassword')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
