import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  Navigate: (props: any) => {
    mockNavigate(props)
    return <div data-testid="navigate" data-to={props.to} data-replace={String(props.replace)} />
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

const mockUseAuth = vi.fn()
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

import PermissionRoute from './PermissionRoute'
import toast from 'react-hot-toast'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PermissionRoute', () => {
  it('shows loading when loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    render(<PermissionRoute><div>child</div></PermissionRoute>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('redirects to /login when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    render(<PermissionRoute><div>child</div></PermissionRoute>)
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('renders children when user has required permission (single string)', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', permissions: ['users:read'] },
      loading: false,
    })
    render(<PermissionRoute permission="users:read"><div>child</div></PermissionRoute>)
    expect(screen.getByText('child')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('renders children when user has all required permissions (array)', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', permissions: ['users:read', 'users:write'] },
      loading: false,
    })
    render(<PermissionRoute permission={['users:read', 'users:write']}><div>child</div></PermissionRoute>)
    expect(screen.getByText('child')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('matches permissions case-insensitively', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', permissions: ['CAN_READ_ANNOUNCEMENTS', 'CAN_CREATE_ANNOUNCEMENTS'] },
      loading: false,
    })
    render(<PermissionRoute permission={['can_read_announcements', 'can_create_announcements']}><div>child</div></PermissionRoute>)
    expect(screen.getByText('child')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('redirects to /dashboard when missing single permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', permissions: ['users:read'] },
      loading: false,
    })
    render(<PermissionRoute permission="users:write"><div>child</div></PermissionRoute>)
    expect(toast.error).toHaveBeenCalledWith('Access denied. You do not have the required permissions.')
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true')
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('redirects to /dashboard when missing any permission in array', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', permissions: ['users:read'] },
      loading: false,
    })
    render(<PermissionRoute permission={['users:read', 'users:write']}><div>child</div></PermissionRoute>)
    expect(toast.error).toHaveBeenCalled()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('renders children when no permission prop provided', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', permissions: [] },
      loading: false,
    })
    render(<PermissionRoute><div>child</div></PermissionRoute>)
    expect(screen.getByText('child')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })
})
