import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfirmPasswordReset } from '../hooks/useAuth'
import AuthLayout from '../components/AuthLayout'

export default function ResetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const phoneParam = searchParams.get('phone') || ''

  const [phoneNumber, setPhoneNumber] = useState(phoneParam)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const mut = useConfirmPasswordReset()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!phoneNumber.trim() || !otp.trim() || !newPassword.trim()) {
      setError(t('validation.requiredFields'))
      return
    }
    if (newPassword.length < 8) {
      setError(t('validation.passwordMinLength'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('validation.passwordMismatch'))
      return
    }

    try {
      await mut.mutateAsync({ phoneNumber: phoneNumber.trim(), otp: otp.trim(), newPassword })
      setSuccess(t('auth.resetPasswordSuccess'))
      setTimeout(() => window.location.assign('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    }
  }

  return (
    <AuthLayout title={t('auth.resetPassword')}>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="form-group">
          <label htmlFor="phone">{t('auth.phoneNumber')}</label>
          <input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+2348012345678"
            autoComplete="tel"
            autoFocus={!phoneParam}
          />
        </div>
        <div className="form-group">
          <label htmlFor="otp">{t('auth.otpCode')}</label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t('auth.otpPlaceholder')}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">{t('auth.newPassword')}</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('validation.minLength').replace('{{min}}', '8')}
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.confirmNewPassword')}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={mut.isPending}>
          {mut.isPending ? t('auth.resetting') : t('auth.resetPassword')}
        </button>
        <p className="auth-footer-text">
          <Link to="/forgot-password">{t('auth.requestNewOtp')}</Link> &middot;{' '}
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
