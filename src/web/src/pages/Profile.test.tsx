import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Profile from './Profile'

const mockUseProfile = vi.fn()
const mockUpdateMutateAsync = vi.fn()
const mockChangePwMutateAsync = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}))
const mockUpdateProfileContext = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'jdoe', phoneNumber: '1234567', roles: ['ADMIN'] }, updateProfileContext: mockUpdateProfileContext }),
}))
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => mockUseProfile(),
  useUpdateProfile: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
  useChangePassword: () => ({ mutateAsync: mockChangePwMutateAsync, isPending: false }),
}))
vi.mock('../services/api', () => ({
  authApi: { stepUp: vi.fn() },
}))

import { showSuccessToast, showErrorToast } from '../shared/utils/swal'

function renderProfile() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><Profile /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseProfile.mockReturnValue({
    data: { firstName: 'John', lastName: 'Doe', middleName: 'M', email: 'john@test.com', phoneNumber: '1234567890', username: 'jdoe' },
    isLoading: false,
    isError: false,
    error: null,
  })
  mockUpdateMutateAsync.mockResolvedValue({
    confirmed: true,
    refreshFailed: false,
    refreshError: null,
    profile: { firstName: 'Jane', lastName: 'Doe', middleName: 'M', email: 'john@test.com', phoneNumber: '1234567890', username: 'jdoe' },
  })
})

describe('Profile', () => {
  it('hydrates form fields from profile data', async () => {
    renderProfile()
    expect(await screen.findByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument()
  })

  it('shows validation error for invalid phone and does not submit', async () => {
    const user = userEvent.setup()
    renderProfile()
    const tel = await screen.findByDisplayValue('1234567890')
    await user.clear(tel)
    await user.type(tel, '12')
    await user.click(screen.getByRole('button', { name: 'common.save' }))
    expect(showErrorToast).toHaveBeenCalled()
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled()
  })

  it('submits valid changes and shows success', async () => {
    const user = userEvent.setup()
    renderProfile()
    const first = await screen.findByDisplayValue('John')
    await user.clear(first)
    await user.type(first, 'Jane')
    await user.click(screen.getByRole('button', { name: 'common.save' }))
    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled())
    expect(showSuccessToast).toHaveBeenCalledWith('profile.updateSuccess')
  })

  it('preserves input on save error', async () => {
    const user = userEvent.setup()
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error('boom'))
    renderProfile()
    const first = await screen.findByDisplayValue('John')
    await user.clear(first)
    await user.type(first, 'Jane')
    await user.click(screen.getByRole('button', { name: 'common.save' }))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith('boom'))
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
  })

  it('shows load error state and allows retry', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error('load failed'), refetch })
    renderProfile()
    expect(await screen.findByTestId('profile-load-error')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry|common.retry/i }))
    expect(refetch).toHaveBeenCalled()
  })

  it('rehydrates on remount/navigation return', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockUseProfile.mockReturnValue({ data: { firstName: 'John', lastName: 'Doe', middleName: 'M', email: 'john@test.com', phoneNumber: '1234567890', username: 'jdoe' }, isLoading: false, isError: false, error: null })
    const { unmount } = render(<QueryClientProvider client={qc}><Profile /></QueryClientProvider>)
    expect(await screen.findByDisplayValue('John')).toBeInTheDocument()
    unmount()
    mockUseProfile.mockReturnValue({ data: { firstName: 'Alice', lastName: 'Doe', middleName: 'M', email: 'alice@test.com', phoneNumber: '1234567890', username: 'jdoe' }, isLoading: false, isError: false, error: null })
    render(<QueryClientProvider client={qc}><Profile /></QueryClientProvider>)
    expect(await screen.findByDisplayValue('Alice')).toBeInTheDocument()
  })
})
