import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'tiv', label: 'Tiv' },
  { code: 'ha', label: 'Hausa' },
]

interface NavItem {
  to: string
  icon: string
  labelKey: string
  permission?: string | string[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: '▦', labelKey: 'nav.dashboard' },
  { to: '/churches', icon: '⛪', labelKey: 'nav.churches', permission: 'can_read_church' },
  { to: '/pastors', icon: '✝️', labelKey: 'nav.pastors', permission: 'can_read_pastor' },
  { to: '/elders', icon: '👴', labelKey: 'nav.elders', permission: 'can_read_elders' },
  { to: '/deacons', icon: '🤝', labelKey: 'nav.deacons', permission: 'can_read_deacons' },
  { to: '/members', icon: '👥', labelKey: 'nav.members', permission: 'can_read_members' },
  { to: '/admins', icon: '🛡️', labelKey: 'nav.admins', permission: ['can_update_church', 'can_update_member'] },
  { to: '/projects', icon: '📋', labelKey: 'nav.projects', permission: 'can_read_projects' },
  { to: '/contributions', icon: '💰', labelKey: 'nav.contributions', permission: 'can_read_contribution' },
  { to: '/announcements', icon: '📢', labelKey: 'nav.announcements', permission: 'can_read_announcements' },
  { to: '/notifications', icon: '🔔', labelKey: 'nav.notifications', permission: 'can_read_notification' },
  { to: '/settings', icon: '⚙', labelKey: 'nav.settings', permission: 'can_read_settings' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function closeSidebar() { setSidebarOpen(false) }

  return (
    <div className={`layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-top">
            <div className="sidebar-brand-icon" />
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">NKST</div>
              <div className="sidebar-brand-sub">
                Nongo u Kristu u ken Sudan hen Tiv
              </div>
            </div>
          </div>
          <div className="sidebar-tiv-pattern" />
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">{t('nav.dashboard')}</div>
          {navItems
            .filter((item) => {
              if (!item.permission) return true
              const perms = Array.isArray(item.permission) ? item.permission : [item.permission]
              const userPerms = (user?.permissions ?? []).map((p) => p.toLowerCase())
              return perms.every((p) => userPerms.includes(p.toLowerCase()))
            })
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-item" onClick={logout} style={{ cursor: 'pointer' }}>
            <span className="icon">🚪</span>
            {t('auth.logout')}
          </div>
        </div>
      </aside>
      <div className="main-wrapper">
        <header className="main-header">
          <div className="main-header-inner">
            <div className="header-left">
              <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <span /><span /><span />
              </button>
              <div className="header-search">
                <span>🔍</span>
                <input type="text" placeholder={t('common.search') + '...'} />
              </div>
            </div>
            <div className="header-right">
              <div className="lang-select-btn">
                <svg className="lang-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span className="lang-code">{i18n.language.toUpperCase()}</span>
                <svg className="lang-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                <select
                  value={i18n.language}
                  onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem('i18nextLng', e.target.value) }}
                  aria-label="Switch language"
                >
                  {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <a href="/notifications" className="header-btn">
                🔔
                <span className="header-badge" />
              </a>
              <a href="/profile" className="header-user" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="header-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="header-user-name">{user?.username}</span>
              </a>
            </div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
