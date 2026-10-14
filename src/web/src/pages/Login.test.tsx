import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useSearchParams: () => [new URLSearchParams(), vi.fn()], Link: ({ children, to }: any) => <a href={to}>{children}</a> }
})

const mockLogin = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, login: mockLogin, logout: vi.fn(), loading: false }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

vi.mock('../components/AuthLayout', () => ({
  default: ({ title, children }: any) => <div data-testid="auth-layout"><h2>{title}</h2>{children}</div>,
}))

vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}))

import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import * as AuthContext from '../context/AuthContext'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login', () => {
  it('renders login form with username and password fields', () => {
    render(<Login />)
    expect(screen.getByLabelText('auth.username')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument()
    expect(screen.getByText('auth.signIn')).toBeInTheDocument()
  })

  it('redirects to /dashboard when user is already logged in', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { username: 'admin', permissions: [], churchId: '1', roles: ['ADMIN'] },
      login: mockLogin,
      logout: vi.fn(),
      loading: false,
    })
    render(<Login />)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('submits form with credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(null)
    render(<Login />)

    await user.type(screen.getByLabelText('auth.username'), 'admin')
    await user.type(screen.getByLabelText('auth.password'), 'secret')
    await user.click(screen.getByText('auth.signIn'))

    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret')
  })

  it('shows error toast when validation fails (empty fields)', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.click(screen.getByText('auth.signIn'))

    expect(showErrorToast).toHaveBeenCalledWith('validation.requiredFields')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows success toast and navigates on successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(null)
    render(<Login />)

    await user.type(screen.getByLabelText('auth.username'), 'admin')
    await user.type(screen.getByLabelText('auth.password'), 'secret')
    await user.click(screen.getByText('auth.signIn'))

    await vi.waitFor(() => {
      expect(showSuccessToast).toHaveBeenCalledWith('auth.signInSuccess')
    })
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('shows error toast on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue('Invalid credentials')
    render(<Login />)

    await user.type(screen.getByLabelText('auth.username'), 'admin')
    await user.type(screen.getByLabelText('auth.password'), 'wrong')
    await user.click(screen.getByText('auth.signIn'))

    await vi.waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup()
    let resolveLogin: any
    mockLogin.mockImplementation(() => new Promise((r) => { resolveLogin = r }))
    render(<Login />)

    await user.type(screen.getByLabelText('auth.username'), 'admin')
    await user.type(screen.getByLabelText('auth.password'), 'secret')
    await user.click(screen.getByText('auth.signIn'))

    expect(screen.getByText('auth.signingIn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /auth.signingIn/i })).toBeDisabled()

    resolveLogin(null)
  })

  it('navigates to /forgot-password when link clicked', () => {
    render(<Login />)
    const link = screen.getByText('auth.forgotPassword')
    expect(link).toHaveAttribute('href', '/forgot-password')
  })
})
