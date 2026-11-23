import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { hasPermission } from '../utils/permissions'

interface Props {
  children: React.ReactNode
  permission?: string | string[]
}

export default function PermissionRoute({ children, permission }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  if (permission && !hasPermission(user.permissions, permission)) {
    toast.error('Access denied. You do not have the required permissions.')
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
