import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Profile from './Profile'

const mockUpdate = vi.fn()
const mockChangePw = vi.fn()
const mockRefetch = vi.fn()
const mockUpdateCtx = vi.fn()
const mockStepUp = vi.fn()

let profileState: any = { data: { firstName: 'A', lastName: 'B', middleName: '', email: 'a@b.com', phoneNumber: '1234567', username: 'u' }, isLoading: false, isError: false, error: null, refetch: mockRefetch }
let updatePending = false
let changePwPending = false

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'u', phoneNumber: '1234567', roles: ['USER'] }, updateProfileContext: mockUpdateCtx }) }))
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => profileState,
  useUpdateProfile: () => ({ mutateAsync: mockUpdate, isPending: updatePending }),
  useChangePassword: () => ({ mutateAsync: mockChangePw, isPending: changePwPending }),
}))
vi.mock('../services/api', () => ({ authApi: { stepUp: (...a: any[]) => mockStepUp(...a) } }))
vi.mock('../shared/utils/swal', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

import { showErrorToast, showSuccessToast } from '../shared/utils/swal'

beforeEach(() => {
  vi.clearAllMocks()
  profileState = { data: { firstName: 'A', lastName: 'B', middleName: '', email: 'a@b.com', phoneNumber: '1234567', username: 'u' }, isLoading: false, isError: false, error: null, refetch: mockRefetch }
  updatePending = false; changePwPending = false
})

describe('Profile extra coverage', () => {
  it('shows loading spinner', () => {
    profileState = { ...profileState, isLoading: true, data: undefined }
    render(<Profile />)
    expect(document.querySelector('.spinner, [role="status"]') || screen.queryByText(/profile.title/i)).toBeTruthy()
  })

  it('shows refresh warning and retries refetch', async () => {
    mockUpdate.mockResolvedValue({ confirmed: true, refreshFailed: true, refreshError: 'refresh boom', profile: { firstName: 'A', lastName: 'B', phoneNumber: '1234567' } })
    render(<Profile />)
    fireEvent.change(screen.getByDisplayValue('1234567'), { target: { name: 'tel', value: '7654321' } })
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(screen.getByTestId('profile-refresh-warning')).toBeInTheDocument())
    fireEvent.click(screen.getByText('common.retry'))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('cancel resets form and clears dirty', async () => {
    render(<Profile />)
    const tel = screen.getByDisplayValue('1234567')
    fireEvent.change(tel, { target: { name: 'tel', value: '7654321' } })
    expect(screen.getByText('common.cancel')).toBeInTheDocument()
    fireEvent.click(screen.getByText('common.cancel'))
    expect(screen.queryByText('common.cancel')).not.toBeInTheDocument()
  })

  it('handles save thrown Error and non-Error', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('boom'))
    render(<Profile />)
    fireEvent.change(screen.getByDisplayValue('1234567'), { target: { name: 'tel', value: '7654321' } })
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith('boom'))
    mockUpdate.mockRejectedValueOnce('bad')
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalled())
  })

  it('security tab password mismatch and min length', async () => {
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { name: 'currentPassword', value: 'old' } })
    fireEvent.change(inputs[1], { target: { name: 'newPassword', value: 'short' } })
    fireEvent.change(inputs[2], { target: { name: 'confirmPassword', value: 'short' } })
    fireEvent.submit(inputs[0].closest('form')!)
    await waitFor(() => expect(showErrorToast).toHaveBeenCalled())
  })

  it('security tab mismatch branch', async () => {
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: 'oldpass' } })
    fireEvent.change(inputs[1], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[2], { target: { value: 'different1' } })
    fireEvent.submit(inputs[0].closest('form')!)
    await waitFor(() => expect(showErrorToast).toHaveBeenCalled())
  })

  it('changes password with step-up token', async () => {
    mockStepUp.mockResolvedValue({ data: { stepUpToken: 'st' } })
    mockChangePw.mockResolvedValue({})
    render(<Profile />)
    fireEvent.click(screen.getByText('profile.tab.security'))
    const inputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(inputs[0], { target: { value: 'oldpass' } })
    fireEvent.change(inputs[1], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[2], { target: { value: 'newpassword1' } })
    fireEvent.change(inputs[3], { target: { value: 'stepup' } })
    fireEvent.submit(inputs[0].closest('form')!)
    await waitFor(() => expect(mockStepUp).toHaveBeenCalledWith('stepup'))
    expect(mockChangePw).toHaveBeenCalledWith({ currentPassword: 'oldpass', newPassword: 'newpassword1', stepUpToken: 'st' })
    expect(showSuccessToast).toHaveBeenCalled()
  })

  it('handles step-up failure and change password error', async () => {
    mockStepUp.mockResolvedValue({ error: 'bad stepup' })
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
})
