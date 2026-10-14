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

const mockUseAuth = vi.fn()
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

import ProtectedRoute from './ProtectedRoute'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProtectedRoute', () => {
  it('shows loading screen when loading is true', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    render(<ProtectedRoute><div>child</div></ProtectedRoute>)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('redirects to /login when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    render(<ProtectedRoute><div>child</div></ProtectedRoute>)
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true')
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('renders children when user exists', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', username: 'admin' }, loading: false })
    render(<ProtectedRoute><div>protected content</div></ProtectedRoute>)
    expect(screen.getByText('protected content')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })
})
