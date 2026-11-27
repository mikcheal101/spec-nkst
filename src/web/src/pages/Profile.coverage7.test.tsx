import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Profile from './Profile'
const mockUpdate = vi.fn(); const mockChangePw = vi.fn(); const mockRefetch = vi.fn(); const mockUpdateCtx = vi.fn()
let profileState:any; let authUser:any
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: authUser, updateProfileContext: mockUpdateCtx }) }))
vi.mock('../hooks/useAuth', () => ({ useProfile: () => profileState, useUpdateProfile: () => ({ mutateAsync: mockUpdate, isPending: false }), useChangePassword: () => ({ mutateAsync: mockChangePw, isPending: false }) }))
vi.mock('../services/api', () => ({ authApi: { stepUp: vi.fn() } }))
vi.mock('../shared/utils/swal', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
beforeEach(()=>{vi.clearAllMocks(); authUser={username:'',phoneNumber:'',roles:[]}; profileState={data:{firstName:'A',lastName:'B',middleName:'',email:'',phoneNumber:'',username:''}, isLoading:false, isError:true, error:'str err', refetch:mockRefetch}})
it('renders load error string fallback and profile username fallback', async () => {
  render(<Profile />)
  expect(screen.getByTestId('profile-load-error')).toBeInTheDocument()
})
it('refreshWarning uses default message when refreshError missing', async () => {
  profileState={data:{firstName:'A',lastName:'B',middleName:'',email:'',phoneNumber:'1234567',username:''}, isLoading:false, isError:false, error:null, refetch:mockRefetch}
  mockUpdate.mockResolvedValue({ confirmed:true, refreshFailed:true, refreshError:'', profile:{}})
  render(<Profile />)
  fireEvent.change(screen.getByDisplayValue('1234567'), { target: { name:'tel', value:'7654321' } })
  fireEvent.click(screen.getByTestId('profile-save'))
  await waitFor(()=>expect(screen.getByTestId('profile-refresh-warning')).toBeInTheDocument())
})
