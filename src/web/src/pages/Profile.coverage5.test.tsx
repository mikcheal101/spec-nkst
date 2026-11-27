import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Profile from './Profile'

const mockUpdate = vi.fn()
const mockChangePw = vi.fn()
const mockRefetch = vi.fn()
const mockUpdateCtx = vi.fn()
let profileState: any
let authUser: any

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: authUser, updateProfileContext: mockUpdateCtx }) }))
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => profileState,
  useUpdateProfile: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useChangePassword: () => ({ mutateAsync: mockChangePw, isPending: false }),
}))
vi.mock('../services/api', () => ({ authApi: { stepUp: vi.fn() } }))
vi.mock('../shared/utils/swal', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

import { showErrorToast } from '../shared/utils/swal'

beforeEach(() => {
  vi.clearAllMocks()
  authUser = { username: 'u', phoneNumber: '1234567', roles: ['USER'] }
  profileState = { data: { firstName: 'A', lastName: 'B', middleName: '', email: 'a@b.com', phoneNumber: '1234567', username: 'u' }, isLoading: false, isError: false, error: null, refetch: mockRefetch }
})

describe('Profile branch coverage5', () => {
  it('save uses normalized/fallback values when result.profile fields missing', async () => {
    mockUpdate.mockResolvedValue({ confirmed: true, refreshFailed: false, profile: {} })
    render(<Profile />)
    fireEvent.change(screen.getByDisplayValue('1234567'), { target: { name: 'tel', value: '7654321' } })
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(mockUpdateCtx).toHaveBeenCalled())
  })
  it('shows superAdmin fallback when no roles and no churchId', () => {
    authUser = { username: 'u', phoneNumber: '1234567', roles: [] }
    render(<Profile />)
    expect(screen.getByText('profile.superAdmin')).toBeInTheDocument()
  })
  it('handles save with non-Error throw', async () => {
    mockUpdate.mockRejectedValue('boom')
    render(<Profile />)
    fireEvent.change(screen.getByDisplayValue('1234567'), { target: { name: 'tel', value: '7654321' } })
    fireEvent.click(screen.getByTestId('profile-save'))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith('Update failed'))
  })
})
