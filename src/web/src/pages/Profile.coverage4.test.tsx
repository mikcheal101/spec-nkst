import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Profile from './Profile'

const mockUpdate = vi.fn()
const mockChangePw = vi.fn()
const mockRefetch = vi.fn()
const mockUpdateCtx = vi.fn()
const mockStepUp = vi.fn()
let profileState: any
let authUser: any

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: authUser, updateProfileContext: mockUpdateCtx }) }))
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => profileState,
  useUpdateProfile: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useChangePassword: () => ({ mutateAsync: mockChangePw, isPending: false }),
}))
vi.mock('../services/api', () => ({ authApi: { stepUp: (...a: any[]) => mockStepUp(...a) } }))
vi.mock('../shared/utils/swal', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

import { showErrorToast } from '../shared/utils/swal'

beforeEach(() => {
  vi.clearAllMocks()
  authUser = { username: 'u', phoneNumber: '1234567', roles: ['USER'] }
  profileState = { data: { firstName: 'A', lastName: 'B', middleName: 'M', email: 'a@b.com', phoneNumber: '1234567', username: 'u' }, isLoading: false, isError: false, error: null, refetch: mockRefetch }
})

describe('Profile coverage4 branch gaps', () => {
  it('handles profile with null/undefined fields and user fallbacks', () => {
    authUser = { username: '', phoneNumber: '', roles: undefined }
    profileState = { data: { firstName: null, lastName: null, middleName: null, email: null, phoneNumber: null, username: null }, isLoading: false, isError: false, error: null, refetch: mockRefetch }
    render(<Profile />)
    expect(screen.getByTestId('profile-save')).toBeInTheDocument()
  })

  it('shows error when profile update returns refresh failed without refreshError', async () => {
    mockUpdate.mockResolvedValue({ confirmed: true, refreshFailed: true, refreshError: undefined, profile: { firstName: 'A', lastName: 'B', phoneNumber: '1234567' } })
    render(<Profile />)
    fireEvent.change(screen.getByDisplayValue('1234567'), { target: { name: 'tel', value: '7654321' } })
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(screen.getByTestId('profile-refresh-warning')).toBeInTheDocument())
  })

  it('handles change password stepUp error object without message', async () => {
    mockStepUp.mockResolvedValue({ error: '' })
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: 'oldpass' } })
    fireEvent.change(inputs[1], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[2], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[3], { target: { value: 'stepup' } })
    fireEvent.submit(inputs[0].closest('form')!)
    await waitFor(() => expect(showErrorToast).toHaveBeenCalled())
  })

  it('renders user roles fallback to churchAdmin/superAdmin text', () => {
    authUser = { username: 'u', phoneNumber: '1234567', roles: [], churchId: '1' }
    render(<Profile />)
    expect(screen.getByText('profile.churchAdmin')).toBeInTheDocument()
  })
})
