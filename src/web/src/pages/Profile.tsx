import { useState, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { useAuth } from '../context/AuthContext'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useAuth'
import { authApi } from '../services/api'
import type { ProfileUpdateRequest } from '../services/api'
import { normalizeProfileUpdateRequest, validateProfileUpdate } from '../shared/utils/profile'
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
  const { user, updateProfileContext } = useAuth()
  const [tab, setTab] = useState<Tab>('personalInfo')
  const { data: profile, isLoading: profileLoading, isError: profileError, error: profileLoadError, refetch: refetchProfile } = useProfile()
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', stepUpPassword: '' })

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        tel: profile.phoneNumber || user?.phoneNumber || '',
        emailAddress: profile.email || '',
      })
      setDirty(false)
      setFieldErrors({})
    }
  }, [profile, user?.phoneNumber])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = { ...form, [e.target.name]: e.target.value }
    setForm(next)
    setDirty(true)
    if (fieldErrors[e.target.name]) {
      const copy = { ...fieldErrors }
      delete copy[e.target.name]
      setFieldErrors(copy)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setRefreshWarning(null)
    const normalized = normalizeProfileUpdateRequest(form)
    const errors = validateProfileUpdate(normalized)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      showErrorToast(Object.values(errors)[0])
      return
    }
    try {
      const result = await updateProfileMut.mutateAsync(normalized)
      updateProfileContext({
        phoneNumber: result.profile.phoneNumber || normalized.tel,
        email: result.profile.email || normalized.emailAddress,
        firstName: result.profile.firstName || normalized.firstName,
        lastName: result.profile.lastName || normalized.lastName,
        middleName: result.profile.middleName || normalized.middleName,
        username: result.profile.username || user?.username,
      })
      if (result.confirmed && result.refreshFailed) {
        setRefreshWarning(result.refreshError || 'Profile saved, but refreshing latest data failed.')
      }
      showSuccessToast(t('profile.updateSuccess'))
      setDirty(false)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    const { currentPassword, newPassword, confirmPassword, stepUpPassword } = pwForm
    if (newPassword !== confirmPassword) {
      showErrorToast(t('validation.passwordMismatch'))
      return
    }
    if (newPassword.length < 8) {
      showErrorToast(t('validation.passwordMinLength'))
      return
    }
    try {
      let stepUpToken: string | undefined
      if (stepUpPassword) {
        const stepUp = await authApi.stepUp(stepUpPassword)
        if (stepUp.error || !stepUp.data?.stepUpToken) throw new Error(stepUp.error || 'Step-up confirmation failed')
        stepUpToken = stepUp.data.stepUpToken
      }
      await changePwMut.mutateAsync({ currentPassword, newPassword, stepUpToken })
      showSuccessToast(t('profile.passwordChanged'))
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '', stepUpPassword: '' })
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
          ) : profileError ? (
            <div className="alert alert-danger" role="alert" data-testid="profile-load-error">
              <div>{profileLoadError instanceof Error ? profileLoadError.message : t('common.error')}</div>
              <button type="button" className="btn btn-outline" style={{ marginTop: '0.75rem' }} onClick={() => void refetchProfile()}>{t('common.retry') || 'Retry'}</button>
            </div>
          ) : (
            <form onSubmit={handleSave} noValidate>
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
                  <input name="emailAddress" type="email" value={form.emailAddress} onChange={handleChange} aria-invalid={!!fieldErrors.emailAddress} style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </InputWrap>
                {fieldErrors.emailAddress && <div className="form-error" role="alert">{fieldErrors.emailAddress}</div>}
              </div>
              <div className="form-group">
                <label>{t('auth.phoneNumber')}</label>
                <InputWrap icon="📞">
                  <input name="tel" value={form.tel} onChange={handleChange} aria-invalid={!!fieldErrors.tel} style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </InputWrap>
                {fieldErrors.tel && <div className="form-error" role="alert">{fieldErrors.tel}</div>}
              </div>
              <div className="form-group">
                <label>{t('auth.username')}</label>
                <InputWrap icon="🔑">
                  <input value={user?.username || profile?.username || ''} disabled style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </InputWrap>
              </div>
              {refreshWarning && (
                <div className="alert alert-warning" role="status" data-testid="profile-refresh-warning" style={{ marginTop: '1rem' }}>
                  <div>{refreshWarning}</div>
                  <button type="button" className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => { setRefreshWarning(null); void refetchProfile() }}>{t('common.retry') || 'Retry'}</button>
                </div>
              )}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={updateProfileMut.isPending || !dirty} data-testid="profile-save" data-dirty={dirty ? 'true' : 'false'}>
                  {updateProfileMut.isPending ? t('common.saving') : t('common.save')}
                </button>
                {dirty && (
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setDirty(false)
                    setFieldErrors({})
                    setRefreshWarning(null)
                    setForm({
                      firstName: profile?.firstName || '',
                      lastName: profile?.lastName || '',
                      middleName: profile?.middleName || '',
                      tel: profile?.phoneNumber || user?.phoneNumber || '',
                      emailAddress: profile?.email || '',
                    })
                  }}>
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
            <div className="form-group">
              <label>Step-up confirmation password (required for protected accounts)</label>
              <InputWrap icon="🛡️">
                <input name="stepUpPassword" type="password" value={pwForm.stepUpPassword} onChange={(e) => setPwForm({ ...pwForm, stepUpPassword: e.target.value })} style={{ paddingLeft: '2.25rem', width: '100%' }} placeholder="Enter password again for sensitive action" />
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
