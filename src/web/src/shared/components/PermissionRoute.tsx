import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

interface Props {
  children: React.ReactNode
  permission?: string | string[]
}

export default function PermissionRoute({ children, permission }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  if (permission) {
    const required = Array.isArray(permission) ? permission : [permission]
    const userPerms = (user.permissions ?? []).map((p) => p.toLowerCase())
    const hasAll = required.every((p) => userPerms.includes(p.toLowerCase()))
    if (!hasAll) {
      toast.error('Access denied. You do not have the required permissions.')
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
