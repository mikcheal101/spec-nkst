import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
}))

let mockUser: any = null
let mockLoading = false
const mockLogout = vi.fn()
const mockLogin = vi.fn()

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, loading: mockLoading, login: mockLogin, logout: mockLogout }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('./hooks/useAuth', () => ({
  useLogin: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useLogout: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))
vi.mock('./pages/Dashboard', () => ({ default: () => <div data-testid="dashboard" /> }))
vi.mock('./pages/Members', () => ({ default: () => <div /> }))
vi.mock('./pages/Pastors', () => ({ default: () => <div /> }))
vi.mock('./pages/PastorDetail', () => ({ default: () => <div /> }))
vi.mock('./pages/Elders', () => ({ default: () => <div /> }))
vi.mock('./pages/Deacons', () => ({ default: () => <div /> }))
vi.mock('./pages/PersonDetail', () => ({ default: () => <div /> }))
vi.mock('./pages/Announcements', () => ({ default: () => <div /> }))
vi.mock('./pages/Contributions', () => ({ default: () => <div /> }))
vi.mock('./pages/Projects', () => ({ default: () => <div /> }))
vi.mock('./pages/Churches', () => ({ default: () => <div /> }))
vi.mock('./pages/ChurchDetail', () => ({ default: () => <div /> }))
vi.mock('./pages/Notifications', () => ({ default: () => <div /> }))
vi.mock('./pages/Settings', () => ({ default: () => <div /> }))
vi.mock('./pages/Profile', () => ({ default: () => <div /> }))
vi.mock('./pages/Admins', () => ({ default: () => <div /> }))
vi.mock('./pages/Login', () => ({ default: () => <div data-testid="login" /> }))
vi.mock('./pages/ForgotPassword', () => ({ default: () => <div /> }))
vi.mock('./pages/ResetPassword', () => ({ default: () => <div /> }))
vi.mock('./components/Layout', () => ({ default: ({ children }: any) => <div>{children}</div> }))
vi.mock('./shared/components/LanguageSwitcher', () => ({ default: () => <div className="language-switcher" /> }))
vi.mock('./shared/components/ProtectedRoute', () => ({ default: ({ children }: any) => <>{children}</> }))
vi.mock('./shared/components/PermissionRoute', () => ({ default: ({ children }: any) => <>{children}</> }))
vi.mock('./App.css', () => ({}))

import App from './App'

beforeEach(() => {
  vi.clearAllMocks()
  mockUser = null
  mockLoading = false
})

describe('App', () => {
  it('shows LanguageSwitcher when no user', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(document.querySelector('.language-switcher')).toBeInTheDocument()
  })

  it('hides LanguageSwitcher when user is logged in', () => {
    mockUser = { username: 'admin', permissions: [], churchId: '1' }
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )
    expect(document.querySelector('.language-switcher')).not.toBeInTheDocument()
  })

  it('renders routes container', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(container.querySelector('.language-switcher')).toBeInTheDocument()
  })

  it('redirects root to login', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(document.querySelector('.language-switcher')).toBeInTheDocument()
  })

  it('renders wildcard route redirects to login', () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <App />
      </MemoryRouter>
    )
    expect(document.querySelector('.language-switcher')).toBeInTheDocument()
  })

  it('shows loading screen while auth is loading', () => {
    mockLoading = true
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('redirects logged-in users away from public routes', () => {
    mockUser = { username: 'admin', permissions: [], churchId: '1' }
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })
})
