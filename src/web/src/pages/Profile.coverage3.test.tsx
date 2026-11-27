import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Profile from './Profile'

const mockUpdate = vi.fn()
const mockChangePw = vi.fn()
const mockRefetch = vi.fn()
const mockUpdateCtx = vi.fn()
const mockStepUp = vi.fn()
let profileState: any

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'u', phoneNumber: '1234567', roles: [] }, updateProfileContext: mockUpdateCtx }) }))
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => profileState,
  useUpdateProfile: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useChangePassword: () => ({ mutateAsync: mockChangePw, isPending: false }),
}))
vi.mock('../services/api', () => ({ authApi: { stepUp: (...a: any[]) => mockStepUp(...a) } }))
vi.mock('../shared/utils/swal', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

beforeEach(() => {
  vi.clearAllMocks()
  profileState = { data: { firstName: 'A', lastName: 'B', middleName: '', email: '', phoneNumber: '1234567', username: 'u' }, isLoading: false, isError: false, error: null, refetch: mockRefetch }
})

describe('Profile coverage3', () => {
  it('handles profile with missing fields', () => {
    profileState = { data: {}, isLoading: false, isError: false, error: null, refetch: mockRefetch }
    render(<Profile />)
    expect(screen.getByTestId('profile-save')).toBeDisabled()
  })
  it('shows non-Error load error', () => {
    profileState = { data: undefined, isLoading: false, isError: true, error: 'bad', refetch: mockRefetch }
    render(<Profile />)
    expect(screen.getByTestId('profile-load-error')).toBeInTheDocument()
  })
  it('change password stepUp returns no token', async () => {
    mockStepUp.mockResolvedValue({ data: {} })
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: 'oldpass' } })
    fireEvent.change(inputs[1], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[2], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[3], { target: { value: 'stepup' } })
    fireEvent.submit(inputs[0].closest('form')!)
    await waitFor(() => expect(mockStepUp).toHaveBeenCalled())
  })
})
