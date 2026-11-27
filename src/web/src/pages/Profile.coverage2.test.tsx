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

import { showErrorToast } from '../shared/utils/swal'

beforeEach(() => {
  vi.clearAllMocks()
  profileState = { data: { firstName: 'A', lastName: 'B', middleName: 'M', email: 'a@b.com', phoneNumber: '1234567', username: 'u' }, isLoading: false, isError: false, error: null, refetch: mockRefetch }
})

describe('Profile coverage2', () => {
  it('clears field error on change', async () => {
    render(<Profile />)
    fireEvent.change(screen.getByDisplayValue('1234567'), { target: { name: 'tel', value: 'bad' } })
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    fireEvent.change(screen.getByDisplayValue('bad'), { target: { name: 'tel', value: '1234567' } })
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument()
  })

  it('shows email validation error', async () => {
    render(<Profile />)
    fireEvent.change(screen.getByDisplayValue('a@b.com'), { target: { name: 'emailAddress', value: 'bad' } })
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalled())
  })

  it('change password no stepUp, success', async () => {
    mockChangePw.mockResolvedValue({})
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: 'oldpass' } })
    fireEvent.change(inputs[1], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[2], { target: { value: 'newpassword1' } })
    fireEvent.submit(inputs[0].closest('form')!)
    await waitFor(() => expect(mockChangePw).toHaveBeenCalled())
  })

  it('change password error message fallback', async () => {
    mockChangePw.mockRejectedValue('bad')
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: 'oldpass' } })
    fireEvent.change(inputs[1], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[2], { target: { value: 'newpassword1' } })
    fireEvent.submit(inputs[0].closest('form')!)
    await waitFor(() => expect(showErrorToast).toHaveBeenCalled())
  })
})
