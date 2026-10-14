import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
}))

const { mockUser } = vi.hoisted(() => ({
  mockUser: { username: 'john', permissions: [], churchId: '1', phoneNumber: '+2348012345678', roles: ['ADMIN'] } as any,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}))
vi.mock('../hooks/useAuth', () => ({
  useProfile: vi.fn(),
  useUpdateProfile: vi.fn(),
  useChangePassword: vi.fn(),
}))

import Profile from './Profile'
import { useAuth } from '../context/AuthContext'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useAuth'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'

const mockUpdateProfile = vi.fn().mockResolvedValue(undefined)
const mockChangePassword = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(mockUser, { username: 'john', permissions: [], churchId: '1', phoneNumber: '+2348012345678', roles: ['ADMIN'] })
  vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any)
  vi.mocked(useProfile).mockReturnValue({ data: undefined, isLoading: false } as any)
  vi.mocked(useUpdateProfile).mockReturnValue({ mutateAsync: mockUpdateProfile, isPending: false } as any)
  vi.mocked(useChangePassword).mockReturnValue({ mutateAsync: mockChangePassword, isPending: false } as any)
})

describe('Profile', () => {
  it('renders user info and avatar initial', () => {
    render(<Profile />)
    expect(screen.getByText('john')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders page title and description', () => {
    render(<Profile />)
    expect(screen.getByText('profile.title')).toBeInTheDocument()
    expect(screen.getByText('profile.description')).toBeInTheDocument()
  })

  it('shows personal info tab by default', () => {
    render(<Profile />)
    expect(screen.getByText('members.firstName')).toBeInTheDocument()
    expect(screen.getByText('members.lastName')).toBeInTheDocument()
    expect(screen.getByText('members.email')).toBeInTheDocument()
  })

  it('switches to security tab', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    await user.click(screen.getByText('profile.tab.security'))
    expect(screen.getByText('profile.currentPassword')).toBeInTheDocument()
    expect(screen.getByText('profile.newPassword')).toBeInTheDocument()
    expect(screen.getByText('profile.confirmPassword')).toBeInTheDocument()
  })

  it('switches back to personal info tab', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    await user.click(screen.getByText('profile.tab.security'))
    expect(screen.getByText('profile.currentPassword')).toBeInTheDocument()
    await user.click(screen.getByText('profile.tab.personalInfo'))
    expect(screen.getByText('members.firstName')).toBeInTheDocument()
  })

  it('submits profile update', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    const firstNameInput = screen.getAllByDisplayValue('')[0]
    await user.type(firstNameInput, 'Jane')
    fireEvent.submit(screen.getByText('common.save').closest('form')!)
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled()
      expect(showSuccessToast).toHaveBeenCalledWith('profile.updateSuccess')
    })
  })

  it('shows cancel button when form is dirty', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    expect(screen.queryByText('common.cancel')).not.toBeInTheDocument()
    const firstNameInput = screen.getAllByDisplayValue('')[0]
    await user.type(firstNameInput, 'Jane')
    expect(screen.getByText('common.cancel')).toBeInTheDocument()
  })

  it('resets form on cancel', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    const firstNameInput = screen.getAllByDisplayValue('')[0] as HTMLInputElement
    await user.type(firstNameInput, 'Jane')
    await user.click(screen.getByText('common.cancel'))
    expect(firstNameInput.value).toBe('')
  })

  it('shows error on profile update failure', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'))
    const user = userEvent.setup()
    render(<Profile />)
    const firstNameInput = screen.getAllByDisplayValue('')[0]
    await user.type(firstNameInput, 'Jane')
    fireEvent.submit(screen.getByText('common.save').closest('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Update failed')
    })
  })

  it('disables save button when not dirty', () => {
    render(<Profile />)
    expect(screen.getByText('common.save')).toBeDisabled()
  })

  it('enables save button when form is dirty', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    const firstNameInput = screen.getAllByDisplayValue('')[0]
    await user.type(firstNameInput, 'Jane')
    expect(screen.getByText('common.save')).not.toBeDisabled()
  })

  it('renders disabled username field', () => {
    render(<Profile />)
    expect(screen.getByDisplayValue('john')).toBeDisabled()
  })

  it('renders phone number from user', () => {
    render(<Profile />)
    expect(screen.getByDisplayValue('+2348012345678')).toBeInTheDocument()
  })

  it('shows system admin role when no churchId', () => {
    Object.assign(mockUser, { username: 'superadmin', permissions: [], churchId: undefined, phoneNumber: '', roles: ['SYSTEM_ADMIN'] })
    render(<Profile />)
    expect(screen.getByText('SYSTEM_ADMIN')).toBeInTheDocument()
  })

  it('submits password change with valid data', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    await user.click(screen.getByText('profile.tab.security'))

    const pwInputs = document.querySelectorAll('input[type="password"]')
    await user.type(pwInputs[0], 'oldpassword')
    await user.type(pwInputs[1], 'newpassword123')
    await user.type(pwInputs[2], 'newpassword123')

    fireEvent.submit(pwInputs[0].closest('form')!)
    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({ currentPassword: 'oldpassword', newPassword: 'newpassword123' })
      expect(showSuccessToast).toHaveBeenCalledWith('profile.passwordChanged')
    })
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    await user.click(screen.getByText('profile.tab.security'))

    const pwInputs = document.querySelectorAll('input[type="password"]')
    await user.type(pwInputs[0], 'oldpassword')
    await user.type(pwInputs[1], 'newpassword123')
    await user.type(pwInputs[2], 'different')

    fireEvent.submit(pwInputs[0].closest('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('validation.passwordMismatch')
    })
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('shows error when password too short', async () => {
    const user = userEvent.setup()
    render(<Profile />)
    await user.click(screen.getByText('profile.tab.security'))

    const pwInputs = document.querySelectorAll('input[type="password"]')
    await user.type(pwInputs[0], 'old')
    await user.type(pwInputs[1], 'short')
    await user.type(pwInputs[2], 'short')

    fireEvent.submit(pwInputs[0].closest('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('validation.passwordMinLength')
    })
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('shows error on password change failure', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('Password failed'))
    const user = userEvent.setup()
    render(<Profile />)
    await user.click(screen.getByText('profile.tab.security'))

    const pwInputs = document.querySelectorAll('input[type="password"]')
    await user.type(pwInputs[0], 'oldpassword')
    await user.type(pwInputs[1], 'newpassword123')
    await user.type(pwInputs[2], 'newpassword123')

    fireEvent.submit(pwInputs[0].closest('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Password failed')
    })
  })

  it('shows churchAdmin when roles empty and churchId present', () => {
    Object.assign(mockUser, { username: 'admin', roles: [], churchId: '1', phoneNumber: '', permissions: [] })
    render(<Profile />)
    expect(screen.getByText('profile.churchAdmin')).toBeInTheDocument()
  })

  it('shows superAdmin when no roles and no churchId', () => {
    Object.assign(mockUser, { username: 'admin', roles: [], churchId: undefined, phoneNumber: '', permissions: [] })
    render(<Profile />)
    expect(screen.getByText('profile.superAdmin')).toBeInTheDocument()
  })

  it('shows U avatar when user is null', () => {
    Object.assign(mockUser, { username: null, churchId: undefined, phoneNumber: '', roles: [], permissions: [] })
    render(<Profile />)
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('shows saving text when update profile is pending', () => {
    vi.mocked(useUpdateProfile).mockReturnValue({ mutateAsync: mockUpdateProfile, isPending: true } as any)
    render(<Profile />)
    expect(screen.getByText('common.saving')).toBeInTheDocument()
  })

  it('shows saving text when change password is pending', () => {
    vi.mocked(useChangePassword).mockReturnValue({ mutateAsync: mockChangePassword, isPending: true } as any)
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    expect(screen.getByText('common.saving')).toBeInTheDocument()
  })

  it('shows generic error on profile update non-Error failure', async () => {
    mockUpdateProfile.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Profile />)
    const firstNameInput = screen.getAllByDisplayValue('')[0]
    await user.type(firstNameInput, 'Jane')
    fireEvent.submit(screen.getByText('common.save').closest('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Update failed')
    })
  })

  it('shows generic error on password change non-Error failure', async () => {
    mockChangePassword.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Profile />)
    await user.click(screen.getByText('profile.tab.security'))

    const pwInputs = document.querySelectorAll('input[type="password"]')
    await user.type(pwInputs[0], 'oldpassword')
    await user.type(pwInputs[1], 'newpassword123')
    await user.type(pwInputs[2], 'newpassword123')

    fireEvent.submit(pwInputs[0].closest('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Password change failed')
    })
  })

  it('renders roles as comma-separated when roles present', () => {
    Object.assign(mockUser, { username: 'admin', roles: ['PASTOR', 'ELDER'], churchId: '1', phoneNumber: '', permissions: [] })
    render(<Profile />)
    expect(screen.getByText('PASTOR, ELDER')).toBeInTheDocument()
  })

  it('does not call setForm when user is null on mount', () => {
    Object.assign(mockUser, { username: null, churchId: undefined, phoneNumber: '', roles: [], permissions: [] })
    render(<Profile />)
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('cancel resets form and calls setForm with user phoneNumber', async () => {
    Object.assign(mockUser, { username: 'john', permissions: [], churchId: '1', phoneNumber: '+2348012345678', roles: ['ADMIN'] })
    const user = userEvent.setup()
    render(<Profile />)
    const firstNameInput = screen.getAllByDisplayValue('')[0] as HTMLInputElement
    await user.type(firstNameInput, 'Jane')
    expect(screen.getByText('common.cancel')).toBeInTheDocument()
    await user.click(screen.getByText('common.cancel'))
    expect(firstNameInput.value).toBe('')
    expect(screen.queryByText('common.cancel')).not.toBeInTheDocument()
  })

  it('renders fallback values when user is null', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any)
    render(<Profile />)
    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByText('profile.superAdmin')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('')).toHaveLength(6)
  })

  it('handles cancel when user has no phone number', async () => {
    Object.assign(mockUser, { username: 'john', permissions: [], churchId: '1', phoneNumber: '', roles: ['ADMIN'] })
    const user = userEvent.setup()
    render(<Profile />)
    const firstNameInput = screen.getAllByDisplayValue('')[0] as HTMLInputElement
    await user.type(firstNameInput, 'Jane')
    await user.click(screen.getByText('common.cancel'))
    expect(firstNameInput.value).toBe('')
  })

  it('populates form from fetched profile', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: { firstName: 'John', lastName: 'Doe', middleName: 'M', email: 'john@example.com', phoneNumber: '+2348111222333', username: 'john' },
      isLoading: false,
    } as any)
    render(<Profile />)
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('M')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+2348111222333')).toBeInTheDocument()
  })

  it('shows loading spinner while profile is loading', () => {
    vi.mocked(useProfile).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<Profile />)
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText('common.save')).not.toBeInTheDocument()
  })

  it('does not show spinner once profile is loaded', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: { firstName: 'John', lastName: 'Doe' },
      isLoading: false,
    } as any)
    render(<Profile />)
    expect(document.querySelector('.loading-spinner')).not.toBeInTheDocument()
    expect(screen.getByText('common.save')).toBeInTheDocument()
  })
})
