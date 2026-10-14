import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPassword from './ResetPassword'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  }
})

const { mockMutateAsync, mockIsPending } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
  mockIsPending: { value: false },
}))
vi.mock('../hooks/useAuth', () => ({
  useConfirmPasswordReset: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending.value,
  }),
}))

vi.mock('../components/AuthLayout', () => ({
  default: ({ title, children }: any) => <div data-testid="auth-layout"><h2>{title}</h2>{children}</div>,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockIsPending.value = false
})

describe('ResetPassword', () => {
  it('renders all form fields', () => {
    render(<ResetPassword />)
    expect(screen.getByLabelText('auth.phoneNumber')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.otpCode')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.newPassword')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.confirmNewPassword')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'auth.resetPassword' })).toBeInTheDocument()
  })

  it('shows error when required fields empty', async () => {
    const user = userEvent.setup()
    render(<ResetPassword />)

    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    expect(screen.getByText('validation.requiredFields')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows error when password < 8 chars', async () => {
    const user = userEvent.setup()
    render(<ResetPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.type(screen.getByLabelText('auth.otpCode'), '123456')
    await user.type(screen.getByLabelText('auth.newPassword'), 'short')
    await user.type(screen.getByLabelText('auth.confirmNewPassword'), 'short')
    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    expect(screen.getByText('validation.passwordMinLength')).toBeInTheDocument()
  })

  it('shows error when passwords don\'t match', async () => {
    const user = userEvent.setup()
    render(<ResetPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.type(screen.getByLabelText('auth.otpCode'), '123456')
    await user.type(screen.getByLabelText('auth.newPassword'), 'longpassword')
    await user.type(screen.getByLabelText('auth.confirmNewPassword'), 'differentpwd')
    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    expect(screen.getByText('validation.passwordMismatch')).toBeInTheDocument()
  })

  it('calls mutation on valid submit', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({})
    render(<ResetPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.type(screen.getByLabelText('auth.otpCode'), '123456')
    await user.type(screen.getByLabelText('auth.newPassword'), 'newpassword')
    await user.type(screen.getByLabelText('auth.confirmNewPassword'), 'newpassword')
    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    expect(mockMutateAsync).toHaveBeenCalledWith({
      phoneNumber: '+2348012345678',
      otp: '123456',
      newPassword: 'newpassword',
    })
  })

  it('shows success message after reset', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({})
    render(<ResetPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.type(screen.getByLabelText('auth.otpCode'), '123456')
    await user.type(screen.getByLabelText('auth.newPassword'), 'newpassword')
    await user.type(screen.getByLabelText('auth.confirmNewPassword'), 'newpassword')
    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    await vi.waitFor(() => {
      expect(screen.getByText('auth.resetPasswordSuccess')).toBeInTheDocument()
    })
  })

  it('redirects to /login after delay', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({})
    let capturedCallback: (() => void) | null = null
    const origSetTimeout = globalThis.setTimeout.bind(globalThis)
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any, ms: any) => {
      if (ms === 2000) {
        capturedCallback = fn
        return 0 as any
      }
      return origSetTimeout(fn, ms)
    })

    const originalLocation = window.location
    const mockAssign = vi.fn()
    delete (window as any).location
    ;(window as any).location = { ...originalLocation, assign: mockAssign }

    render(<ResetPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.type(screen.getByLabelText('auth.otpCode'), '123456')
    await user.type(screen.getByLabelText('auth.newPassword'), 'newpassword')
    await user.type(screen.getByLabelText('auth.confirmNewPassword'), 'newpassword')
    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    await vi.waitFor(() => {
      expect(screen.getByText('auth.resetPasswordSuccess')).toBeInTheDocument()
    })

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000)
    capturedCallback!()
    expect(mockAssign).toHaveBeenCalledWith('/login')

    setTimeoutSpy.mockRestore()
    ;(window as any).location = originalLocation
  })

  it('shows error on mutation failure', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('Reset failed'))
    render(<ResetPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.type(screen.getByLabelText('auth.otpCode'), '123456')
    await user.type(screen.getByLabelText('auth.newPassword'), 'newpassword')
    await user.type(screen.getByLabelText('auth.confirmNewPassword'), 'newpassword')
    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    await vi.waitFor(() => {
      expect(screen.getByText('Reset failed')).toBeInTheDocument()
    })
  })

  it('shows generic error on non-Error failure', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce('boom')
    render(<ResetPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.type(screen.getByLabelText('auth.otpCode'), '123456')
    await user.type(screen.getByLabelText('auth.newPassword'), 'newpassword')
    await user.type(screen.getByLabelText('auth.confirmNewPassword'), 'newpassword')
    await user.click(screen.getByRole('button', { name: 'auth.resetPassword' }))

    await vi.waitFor(() => {
      expect(screen.getByText('Reset failed')).toBeInTheDocument()
    })
  })

  it('shows resetting state while pending', () => {
    mockIsPending.value = true
    render(<ResetPassword />)
    expect(screen.getByText('auth.resetting')).toBeInTheDocument()
  })
})
