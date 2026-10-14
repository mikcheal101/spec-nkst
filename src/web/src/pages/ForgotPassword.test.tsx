import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPassword from './ForgotPassword'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useSearchParams: () => [new URLSearchParams(), vi.fn()], Link: ({ children, to }: any) => <a href={to}>{children}</a> }
})

const { mockMutateAsync, mockIsPending } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
  mockIsPending: { value: false },
}))
vi.mock('../hooks/useAuth', () => ({
  useRequestPasswordReset: () => ({
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

describe('ForgotPassword', () => {
  it('renders phone input', () => {
    render(<ForgotPassword />)
    expect(screen.getByLabelText('auth.phoneNumber')).toBeInTheDocument()
    expect(screen.getByText('auth.sendOtp')).toBeInTheDocument()
  })

  it('shows error when phone is empty', async () => {
    const user = userEvent.setup()
    render(<ForgotPassword />)

    await user.click(screen.getByText('auth.sendOtp'))

    expect(screen.getByText('validation.phoneRequired')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('calls mutation on submit', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({})
    render(<ForgotPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.click(screen.getByText('auth.sendOtp'))

    expect(mockMutateAsync).toHaveBeenCalledWith({ phoneNumber: '+2348012345678' })
  })

  it('shows success message after OTP sent', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({})
    render(<ForgotPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.click(screen.getByText('auth.sendOtp'))

    await vi.waitFor(() => {
      expect(screen.getByText('auth.otpSent')).toBeInTheDocument()
    })
  })

  it('navigates to reset-password after delay', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({})
    let capturedCallback: (() => void) | null = null
    const origSetTimeout = globalThis.setTimeout.bind(globalThis)
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any, ms: any) => {
      if (ms === 1500) {
        capturedCallback = fn
        return 0 as any
      }
      return origSetTimeout(fn, ms)
    })
    render(<ForgotPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.click(screen.getByText('auth.sendOtp'))

    await vi.waitFor(() => {
      expect(screen.getByText('auth.otpSent')).toBeInTheDocument()
    })

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500)
    capturedCallback!()
    expect(mockNavigate).toHaveBeenCalledWith('/reset-password?phone=%2B2348012345678')
    setTimeoutSpy.mockRestore()
  })

  it('shows error on mutation failure', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))
    render(<ForgotPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.click(screen.getByText('auth.sendOtp'))

    await vi.waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows generic error on non-Error failure', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce('boom')
    render(<ForgotPassword />)

    await user.type(screen.getByLabelText('auth.phoneNumber'), '+2348012345678')
    await user.click(screen.getByText('auth.sendOtp'))

    await vi.waitFor(() => {
      expect(screen.getByText('Request failed')).toBeInTheDocument()
    })
  })

  it('shows sending state while pending', () => {
    mockIsPending.value = true
    render(<ForgotPassword />)
    expect(screen.getByText('auth.sendingOtp')).toBeInTheDocument()
  })
})
