import { useTranslation } from 'react-i18next'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Pastors from './pages/Pastors'
import PastorDetail from './pages/PastorDetail'
import Elders from './pages/Elders'
import Deacons from './pages/Deacons'
import PersonDetail from './pages/PersonDetail'
import Announcements from './pages/Announcements'
import Contributions from './pages/Contributions'
import Projects from './pages/Projects'
import Churches from './pages/Churches'
import ChurchDetail from './pages/ChurchDetail'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Admins from './pages/Admins'
import Layout from './components/Layout'
import LanguageSwitcher from './shared/components/LanguageSwitcher'
import ProtectedRoute from './shared/components/ProtectedRoute'
import PermissionRoute from './shared/components/PermissionRoute'

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">{t('common.loading')}</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { user } = useAuth()
  return (
    <>
      {!user && <LanguageSwitcher />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/members" element={<PermissionRoute permission="can_read_members"><ProtectedRoute><Layout><Members /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/admins" element={<PermissionRoute permission={['can_update_church', 'can_update_member']}><ProtectedRoute><Layout><Admins /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/announcements" element={<PermissionRoute permission="can_read_announcements"><ProtectedRoute><Layout><Announcements /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/contributions" element={<PermissionRoute permission="can_read_contribution"><ProtectedRoute><Layout><Contributions /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/churches" element={<PermissionRoute permission="can_read_church"><ProtectedRoute><Layout><Churches /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/churches/:id" element={<PermissionRoute permission="can_view_church"><ProtectedRoute><Layout><ChurchDetail /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/pastors" element={<PermissionRoute permission="can_read_pastor"><ProtectedRoute><Layout><Pastors /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/pastors/:id" element={<PermissionRoute permission="can_view_pastor"><ProtectedRoute><Layout><PastorDetail /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/elders" element={<PermissionRoute permission="can_read_elders"><ProtectedRoute><Layout><Elders /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/elders/:id" element={<PermissionRoute permission="can_view_elders"><ProtectedRoute><Layout><PersonDetail /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/deacons" element={<PermissionRoute permission="can_read_deacons"><ProtectedRoute><Layout><Deacons /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/deacons/:id" element={<PermissionRoute permission="can_view_deacons"><ProtectedRoute><Layout><PersonDetail /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/members/:id" element={<PermissionRoute permission="can_view_members"><ProtectedRoute><Layout><PersonDetail /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/projects" element={<PermissionRoute permission="can_read_projects"><ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/notifications" element={<PermissionRoute permission="can_read_notification"><ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/settings" element={<PermissionRoute permission="can_read_settings"><ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute></PermissionRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}
