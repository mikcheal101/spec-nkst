import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      showErrorToast(t('validation.requiredFields'))
      return
    }
    setSubmitting(true)
    const err = await login(username.trim(), password)
    if (err) showErrorToast(err)
    else {
      showSuccessToast(t('auth.signInSuccess'))
      navigate('/dashboard', { replace: true })
    }
    setSubmitting(false)
  }

  return (
    <AuthLayout title={t('auth.signInTitle')}>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">{t('auth.username')}</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.usernamePlaceholder')}
            autoComplete="username"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('auth.password')}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
          {submitting ? <><span className="spinner" />{t('auth.signingIn')}</> : t('auth.signIn')}
        </button>
        <div className="auth-links">
          <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
