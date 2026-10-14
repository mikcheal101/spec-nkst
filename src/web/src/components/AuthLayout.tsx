import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  children: ReactNode
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  const { t } = useTranslation()
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-cross" />
          <h1 className="auth-logo">
            NKST
            <span className="auth-logo-sub">Nongo u Kristu u ken Sudan hen Tiv</span>
          </h1>
          <p className="auth-subtitle">{t('app.subtitle')}</p>
        </div>
        <h2 className="auth-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
