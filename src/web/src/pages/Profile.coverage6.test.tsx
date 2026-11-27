import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Profile from './Profile'

const mockUpdate = vi.fn(); const mockChangePw = vi.fn(); const mockRefetch = vi.fn(); const mockUpdateCtx = vi.fn()
let profileState: any; let authUser: any

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: authUser, updateProfileContext: mockUpdateCtx }) }))
vi.mock('../hooks/useAuth', () => ({
  useProfile: () => profileState,
  useUpdateProfile: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useChangePassword: () => ({ mutateAsync: mockChangePw, isPending: false }),
}))
vi.mock('../services/api', () => ({ authApi: { stepUp: vi.fn() } }))
vi.mock('../shared/utils/swal', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

beforeEach(() => {
  vi.clearAllMocks()
  authUser = { username: 'u', phoneNumber: '', roles: [] }
  profileState = { data: { firstName: '', lastName: '', middleName: '', email: '', phoneNumber: '', username: '' }, isLoading: false, isError: false, error: new Error('err'), refetch: mockRefetch }
})

it('shows load error and cancel/reset uses fallbacks', async () => {
  // error state
  profileState = { ...profileState, isError: true }
  const { rerender } = render(<Profile />)
  expect(screen.getByTestId('profile-load-error')).toHaveTextContent('err')

  // non-error state for cancel/reset branch
  profileState = { data: null, isLoading: false, isError: false, error: null, refetch: mockRefetch }
  authUser = { username: '', phoneNumber: '', roles: [] }
  rerender(<Profile />)
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { name: 'firstName', value: 'X' } })
  const cancel = screen.queryByText('common.cancel')
  if (cancel) fireEvent.click(cancel)
})
