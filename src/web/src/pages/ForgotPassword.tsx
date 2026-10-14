import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRequestPasswordReset } from '../hooks/useAuth'
import AuthLayout from '../components/AuthLayout'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const mut = useRequestPasswordReset()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!phoneNumber.trim()) {
      setError(t('validation.phoneRequired'))
      return
    }

    try {
      await mut.mutateAsync({ phoneNumber: phoneNumber.trim() })
      setSuccess(t('auth.otpSent'))
      setTimeout(() => navigate(`/reset-password?phone=${encodeURIComponent(phoneNumber.trim())}`), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  return (
    <AuthLayout title={t('auth.forgotPassword')}>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <p className="auth-description">
          {t('auth.forgotPasswordDescription')}
        </p>
        <div className="form-group">
          <label htmlFor="phone">{t('auth.phoneNumber')}</label>
          <input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+2348012345678"
            autoComplete="tel"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={mut.isPending}>
          {mut.isPending ? t('auth.sendingOtp') : t('auth.sendOtp')}
        </button>
        <p className="auth-footer-text">
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
