import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">{t('common.loading')}</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
