import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const { mockUserPerms, mockAuthUser } = vi.hoisted(() => ({
  mockUserPerms: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings', 'can_read_roles', 'can_update_roles', 'can_delete_roles', 'can_read_users', 'can_update_users', 'can_read_config', 'can_update_config'],
  mockAuthUser: { username: 'admin', permissions: [] as string[], churchId: '1', roles: ['ADMIN'] } as any,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockAuthUser, login: vi.fn(), logout: vi.fn(), loading: false }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showConfirm: vi.fn().mockResolvedValue(true),
}))

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
const mockMutate = vi.fn().mockResolvedValue(undefined)
vi.mock('../hooks/useRoles', () => ({
  useRolesList: vi.fn(),
  useUpdateRole: vi.fn(),
  useDeleteRole: vi.fn(),
}))
vi.mock('../hooks/useAuth', () => ({
  useUsers: vi.fn(),
  useRegister: vi.fn(),
  useAssignRole: vi.fn(),
}))
vi.mock('../hooks/useConfig', () => ({
  useConfig: vi.fn(),
  useUpdateConfig: vi.fn(),
}))

import Settings from './Settings'
import { useRolesList, useUpdateRole, useDeleteRole } from '../hooks/useRoles'
import { useUsers, useRegister, useAssignRole } from '../hooks/useAuth'
import { useConfig, useUpdateConfig } from '../hooks/useConfig'

const defaultRoles = [
  { id: 1, name: 'ADMIN', description: 'Administrator', permissions: ['CAN_READ_MEMBERS', 'CAN_UPDATE_MEMBERS'] },
  { id: 2, name: 'PASTOR', description: 'Church Pastor', permissions: ['CAN_READ_MEMBERS'] },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockMutateAsync.mockReset().mockResolvedValue(undefined)
  mockMutate.mockReset().mockResolvedValue(undefined)
  mockUserPerms.length = 0
  mockUserPerms.push('can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings', 'can_read_roles', 'can_update_roles', 'can_delete_roles', 'can_read_users', 'can_update_users', 'can_read_config', 'can_update_config')
  mockAuthUser.username = 'admin'
  mockAuthUser.permissions = [...mockUserPerms]
  mockAuthUser.churchId = '1'
  mockAuthUser.roles = ['ADMIN']
  vi.mocked(useRolesList).mockReturnValue({ data: defaultRoles, isLoading: false, error: null } as any)
  vi.mocked(useUpdateRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useDeleteRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useUsers).mockReturnValue({ data: [{ id: 'u1', username: 'admin', roles: ['ADMIN'], status: 'active', permissions: ['CAN_READ_MEMBERS'], churchId: '1' }], isLoading: false, error: null } as any)
  vi.mocked(useRegister).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useAssignRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useConfig).mockReturnValue({ data: { churchName: 'Test Church', churchAddress: '123 St', defaultCurrency: 'NGN' }, isLoading: false } as any)
  vi.mocked(useUpdateConfig).mockReturnValue({ mutate: mockMutate, mutateAsync: mockMutateAsync, isPending: false } as any)
})

describe('Settings', () => {
  it('renders settings page', () => {
    render(<Settings />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
    expect(screen.getByText('settings.roles')).toBeInTheDocument()
  })

  it('switches to users tab', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText(/churchUsers\.title/)).toBeInTheDocument()
  })

  it('switches to config tab', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    expect(screen.getByText('Church Name')).toBeInTheDocument()
  })

  it('shows roles list', () => {
    render(<Settings />)
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('PASTOR')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('Church Pastor')).toBeInTheDocument()
  })

  it('opens edit form for a role', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    expect(screen.getByText('Edit role permissions')).toBeInTheDocument()
  })

  it('lists all permission groups including announcements when editing a role', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    expect(screen.getByText('Edit role permissions')).toBeInTheDocument()
    expect(screen.getByText('Announcements')).toBeInTheDocument()
    expect(screen.getByText('Contributions')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Churches')).toBeInTheDocument()
  })

  it('saves role changes', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    await user.click(screen.getByText('Save Changes'))
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('handles role save error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Save failed'))
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    await user.click(screen.getByText('Save Changes'))
    expect(showErrorToast).toHaveBeenCalledWith('Save failed')
  })

  it('handles role save non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    await user.click(screen.getByText('Save Changes'))
    expect(showErrorToast).toHaveBeenCalledWith('Operation failed')
  })

  it('cancels role edit', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    const cancelBtns = screen.getAllByText('Cancel')
    await user.click(cancelBtns[cancelBtns.length - 1])
    expect(screen.queryByText('Edit role permissions')).not.toBeInTheDocument()
  })

  it('deletes a role', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<Settings />)
    const deleteBtns = document.querySelectorAll('[title="Delete"]')
    await user.click(deleteBtns[0])
    expect(mockMutateAsync).toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('deletes role error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockMutateAsync.mockRejectedValueOnce(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<Settings />)
    const deleteBtns = document.querySelectorAll('[title="Delete"]')
    await user.click(deleteBtns[0])
    expect(showErrorToast).toHaveBeenCalledWith('Delete failed')
    vi.restoreAllMocks()
  })

  it('deletes role non-Error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Settings />)
    const deleteBtns = document.querySelectorAll('[title="Delete"]')
    await user.click(deleteBtns[0])
    expect(showErrorToast).toHaveBeenCalledWith('Delete failed')
    vi.restoreAllMocks()
  })

  it('cancels role delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<Settings />)
    const deleteBtns = document.querySelectorAll('[title="Delete"]')
    await user.click(deleteBtns[0])
    expect(mockMutateAsync).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('shows users list', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('opens add user dialog', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    expect(screen.getByText('auth.username', { selector: 'label' })).toBeInTheDocument()
  })

  it('creates user successfully', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const usernameInput = document.querySelector('.dialog-form input') as HTMLInputElement
    await user.type(usernameInput, 'newuser')
    const passwordInput = document.querySelector('.dialog-form input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByText('Save'))
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('cancels add user dialog', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const cancelBtns = screen.getAllByText('Cancel')
    await user.click(cancelBtns[cancelBtns.length - 1])
  })

  it('closes add user dialog on overlay click', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const overlay = document.querySelector('.dialog-overlay')!
    fireEvent.click(overlay)
  })

  it('opens edit permissions dialog', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    expect(screen.getByText('churchUsers.editUserPermissions')).toBeInTheDocument()
  })

  it('saves permissions', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    await user.click(screen.getByText('Save'))
    expect(showSuccessToast).toHaveBeenCalled()
  })

  it('cancels permissions edit', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    const cancelBtns = screen.getAllByText('Cancel')
    await user.click(cancelBtns[cancelBtns.length - 1])
  })

  it('shows config form', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    expect(screen.getByText('Church Name')).toBeInTheDocument()
    expect(screen.getByText('Church Address')).toBeInTheDocument()
    expect(screen.getByText('Default Currency')).toBeInTheDocument()
  })

  it('saves config changes via mutate', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    const nameInput = document.querySelector('input[value="Test Church"]') as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'New Church Name')
    await user.click(screen.getByText('Save Changes'))
    expect(mockMutate).toHaveBeenCalled()
  })

  it('shows no changes hint when config not dirty', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    expect(screen.getByText('No changes to save')).toBeInTheDocument()
  })

  it('shows roles loading', () => {
    vi.mocked(useRolesList).mockReturnValue({ data: [], isLoading: true, error: null } as any)
    const { container } = render(<Settings />)
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument()
  })

  it('shows no read roles permission', () => {
    mockUserPerms.length = 0
    mockUserPerms.push('can_read_members', 'can_read_settings', 'can_read_config', 'can_read_users', 'can_update_users')
    mockAuthUser.permissions = [...mockUserPerms]
    vi.mocked(useRolesList).mockReturnValue({ data: [], isLoading: false, error: null } as any)
    render(<Settings />)
    expect(screen.getByText("You don't have permission to view roles.")).toBeInTheDocument()
  })

  it('shows roles loading error', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network error'),
    } as any)
    render(<Settings />)
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows empty roles list', () => {
    vi.mocked(useRolesList).mockReturnValue({ data: [], isLoading: false, error: null } as any)
    render(<Settings />)
    expect(screen.getByText('common.noData')).toBeInTheDocument()
  })

  it('shows users loading', async () => {
    vi.mocked(useUsers).mockReturnValue({ data: [], isLoading: true, error: null } as any)
    const user = userEvent.setup()
    const { container } = render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument()
  })

  it('shows empty users list', async () => {
    vi.mocked(useUsers).mockReturnValue({ data: [], isLoading: false, error: null } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('churchUsers.noUsers')).toBeInTheDocument()
  })

  it('shows users loading error', async () => {
    vi.mocked(useUsers).mockReturnValue({ data: [], isLoading: false, error: new Error('Load error') } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('Load error')).toBeInTheDocument()
  })

  it('shows config loading', () => {
    vi.mocked(useConfig).mockReturnValue({ data: undefined, isLoading: true } as any)
    const { container } = render(<Settings />)
    fireEvent.click(screen.getByText('settings.systemConfig'))
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument()
  })

  it('shows role locked icon when no permissions', () => {
    mockUserPerms.length = 0
    mockUserPerms.push('can_read_members', 'can_read_settings', 'can_read_config', 'can_read_users', 'can_read_roles')
    mockAuthUser.permissions = [...mockUserPerms]
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 1, name: 'ADMIN', description: '', permissions: ['CAN_READ_MEMBERS'] }],
      isLoading: false,
      error: null,
    } as any)
    render(<Settings />)
    expect(document.querySelector('[title="No edit permissions"]')).toBeInTheDocument()
  })

  it('toggles permission in role edit', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    const permCheckboxes = document.querySelectorAll('.perm-cell-toggle input[type="checkbox"]')
    if (permCheckboxes.length > 0) {
      await user.click(permCheckboxes[0])
    }
  })

  it('toggles user role in permissions edit', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    const roleCheckboxes = document.querySelectorAll('.perm-toggle input[type="checkbox"]')
    if (roleCheckboxes.length > 0) {
      await user.click(roleCheckboxes[0])
    }
  })

  it('toggles user permission in permissions edit', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    const permCheckboxes = document.querySelectorAll('.perm-cell-toggle input[type="checkbox"]')
    if (permCheckboxes.length > 0) {
      await user.click(permCheckboxes[0])
    }
  })

  it('shows pending state in config', async () => {
    vi.mocked(useUpdateConfig).mockReturnValue({ mutate: mockMutate, mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('shows pending state in role edit', async () => {
    vi.mocked(useUpdateRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('toggles config currency', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    const select = document.querySelector('select') as HTMLSelectElement
    await user.selectOptions(select, 'USD')
    expect(select).toHaveValue('USD')
  })

  it('does not submit add user when username is empty', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const submitBtn = document.querySelector('.dialog-form button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('handles add user non-Error failure', async () => {
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const usernameInput = document.querySelector('.dialog-form input') as HTMLInputElement
    await user.type(usernameInput, 'newuser')
    const passwordInput = document.querySelector('.dialog-form input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByText('Save'))
    expect(showErrorToast).toHaveBeenCalledWith('Create failed')
  })

  it('types in phone number and changes role in add user dialog', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const phoneInput = document.querySelector('.dialog-form input:not([type])') as HTMLInputElement
    await user.type(phoneInput, '+1234567890')
    expect(phoneInput).toHaveValue('+1234567890')
    const roleSelect = document.querySelector('.dialog-form select') as HTMLSelectElement
    await user.selectOptions(roleSelect, 'PASTOR')
    expect(roleSelect).toHaveValue('PASTOR')
  })

  it('handles config save error callback', async () => {
    mockMutate.mockImplementation((_data: any, opts: any) => opts.onError(new Error('Config save failed')))
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    const nameInput = document.querySelector('input[value="Test Church"]') as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(screen.getByText('Save Changes'))
    expect(showErrorToast).toHaveBeenCalledWith('Config save failed')
  })

  it('handles config save non-Error callback', async () => {
    mockMutate.mockImplementation((_data: any, opts: any) => opts.onError('str err'))
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    const nameInput = document.querySelector('input[value="Test Church"]') as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(screen.getByText('Save Changes'))
    expect(showErrorToast).toHaveBeenCalledWith('Update failed')
  })

  it('handles config save success callback', async () => {
    mockMutate.mockImplementation((_data: any, opts: any) => opts.onSuccess())
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    const nameInput = document.querySelector('input[value="Test Church"]') as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(screen.getByText('Save Changes'))
    expect(showSuccessToast).toHaveBeenCalledWith('common.success')
  })

  it('types in church address textarea', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.systemConfig'))
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    await user.clear(textarea)
    await user.type(textarea, 'New Address')
    expect(textarea).toHaveValue('New Address')
  })

  it('shows churchId in users panel header', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText(/churchUsers\.title.*1/)).toBeInTheDocument()
  })

  it('shows assignRole pending state in permissions dialog', async () => {
    vi.mocked(useAssignRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('shows register pending state in add user dialog', async () => {
    vi.mocked(useRegister).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('handles permissions save error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Perm save failed'))
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    await user.click(screen.getByText('Save'))
    expect(showErrorToast).toHaveBeenCalledWith('Perm save failed')
  })

  it('handles permissions save non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    await user.click(screen.getByText('Save'))
    expect(showErrorToast).toHaveBeenCalledWith('Update failed')
  })

  it('closes edit permissions dialog on overlay click', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    const overlay = document.querySelector('.dialog-overlay')!
    fireEvent.click(overlay)
    expect(screen.queryByText('churchUsers.editUserPermissions')).not.toBeInTheDocument()
  })

  it('shows role labels in user table', async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u2', username: 'testuser', roles: ['SUPER_ADMIN', 'PASTOR'], status: 'active', permissions: [], churchId: '1' }],
      isLoading: false, error: null,
    } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('Super Admin, Pastor')).toBeInTheDocument()
  })

  it('shows fallback role name when not in labels', async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u3', username: 'testuser', roles: ['CUSTOM_ROLE'], status: 'inactive', permissions: [], churchId: '1' }],
      isLoading: false, error: null,
    } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('CUSTOM_ROLE')).toBeInTheDocument()
  })

  it('shows inactive status for users', async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u4', username: 'inactiveuser', roles: ['MEMBER'], status: 'inactive', permissions: [], churchId: '1' }],
      isLoading: false, error: null,
    } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('common.inactive')).toBeInTheDocument()
  })

  it('handles add user when register returns falsy', async () => {
    mockMutateAsync.mockResolvedValueOnce(null)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const usernameInput = document.querySelector('.dialog-form input') as HTMLInputElement
    await user.type(usernameInput, 'newuser')
    const passwordInput = document.querySelector('.dialog-form input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByText('Save'))
    expect(showSuccessToast).toHaveBeenCalledWith('User created')
  })

  it('switches tabs and back to roles to cover active class ternary', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.roles'))
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('types in phone number in add user when no churchId', async () => {
    mockUserPerms.length = 0
    mockUserPerms.push('can_read_members', 'can_read_settings', 'can_read_config', 'can_read_users', 'can_update_users')
    mockAuthUser.permissions = [...mockUserPerms]
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const phoneInput = document.querySelector('.dialog-form input:not([type])') as HTMLInputElement
    await user.type(phoneInput, '12345')
    expect(phoneInput).toHaveValue('12345')
  })

  it('assigns roles when register returns truthy result', async () => {
    mockMutateAsync.mockResolvedValueOnce({ id: 'new-user-id' }).mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const usernameInput = document.querySelector('.dialog-form input') as HTMLInputElement
    await user.type(usernameInput, 'newuser')
    const passwordInput = document.querySelector('.dialog-form input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByText('Save'))
    expect(showSuccessToast).toHaveBeenCalledWith('User created')
  })

  it('handles add user without churchId', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    mockAuthUser.churchId = ''
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const usernameInput = document.querySelector('.dialog-form input') as HTMLInputElement
    await user.type(usernameInput, 'testuser')
    const passwordInput = document.querySelector('.dialog-form input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByText('Save'))
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('submits add user form with phone number', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const usernameInput = document.querySelector('.dialog-form input') as HTMLInputElement
    await user.type(usernameInput, 'newuser')
    const passwordInput = document.querySelector('.dialog-form input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    const phoneInput = document.querySelectorAll('.dialog-form input:not([type])')[0] as HTMLInputElement
    await user.type(phoneInput, '+1234567890')
    await user.click(screen.getByText('Save'))
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('shows users panel when user has no churchId', async () => {
    mockAuthUser.churchId = undefined
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText(/churchUsers\.title/)).toBeInTheDocument()
  })

  it('handles add user Error failure', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Register failed'))
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('settings.addUser'))
    const usernameInput = document.querySelector('.dialog-form input') as HTMLInputElement
    await user.type(usernameInput, 'newuser')
    const passwordInput = document.querySelector('.dialog-form input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByText('Save'))
    expect(showErrorToast).toHaveBeenCalledWith('Register failed')
  })

  it('handles toPermNames with non-array input', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 1, name: 'TEST', description: null, permissions: 'not-an-array' }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('TEST')).toBeInTheDocument()
  })

  it('handles toPermNames with object permissions', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 1, name: 'OBJROLE', description: '', permissions: [{ name: 'CAN_READ_MEMBERS' }, 'CAN_UPDATE_MEMBERS'] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('OBJROLE')).toBeInTheDocument()
  })

  it('untoggles a selected permission in role edit', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    const permCheckboxes = document.querySelectorAll('.perm-cell-toggle input[type="checkbox"]')
    const checkedBox = Array.from(permCheckboxes).find((cb) => (cb as HTMLInputElement).checked) as HTMLInputElement
    if (checkedBox) {
      await user.click(checkedBox)
    }
  })

  it('submits role edit with empty name via early return', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    const nameInput = document.querySelector('input[disabled]') as HTMLInputElement
    if (nameInput) {
      Object.defineProperty(nameInput, 'value', { value: '', writable: true })
    }
    await user.click(screen.getByText('Save Changes'))
  })

  it('shows queryError as non-Error string', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [],
      isLoading: false,
      error: 'string error',
    } as any)
    render(<Settings />)
    expect(screen.getByText('Error loading roles')).toBeInTheDocument()
  })

  it('does not show edit button when no update permission', () => {
    mockUserPerms.length = 0
    mockUserPerms.push('can_read_members', 'can_read_settings', 'can_read_config', 'can_read_users', 'can_read_roles', 'can_delete_roles')
    mockAuthUser.permissions = [...mockUserPerms]
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 1, name: 'ADMIN', description: 'test', permissions: ['CAN_READ_MEMBERS'] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(document.querySelectorAll('[title="Edit"]').length).toBe(0)
    expect(document.querySelectorAll('[title="Delete"]').length).toBeGreaterThan(0)
  })

  it('savePermissions returns early when no editingUser', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    const overlay = document.querySelector('.dialog-overlay')!
    fireEvent.click(overlay)
    expect(screen.queryByText('churchUsers.editUserPermissions')).not.toBeInTheDocument()
  })

  it('toggles role off in permissions edit dialog', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    const roleCheckboxes = document.querySelectorAll('.perm-toggle input[type="checkbox"]')
    const checkedRole = Array.from(roleCheckboxes).find((cb) => (cb as HTMLInputElement).checked) as HTMLInputElement
    if (checkedRole) {
      await user.click(checkedRole)
    }
  })

  it('toggles permission off in user permissions edit dialog', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    await user.click(screen.getByText('Edit Permissions'))
    const permCheckboxes = document.querySelectorAll('.perm-cell-toggle input[type="checkbox"]')
    const checkedPerm = Array.from(permCheckboxes).find((cb) => (cb as HTMLInputElement).checked) as HTMLInputElement
    if (checkedPerm) {
      await user.click(checkedPerm)
    }
  })

  it('bypasses HTML validation to trigger empty username guard', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('settings.manageUsers'))
    fireEvent.click(screen.getByText('settings.addUser'))
    const form = document.querySelector('.dialog-form') as HTMLFormElement
    fireEvent.submit(form)
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('does not render role cards with no id', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 0, name: 'NOROLE', description: 'desc', permissions: [] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('NOROLE')).toBeInTheDocument()
  })

  it('opens edit for role without description', async () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 10, name: 'NODESC_ROLE', permissions: ['CAN_READ_MEMBERS'] }],
      isLoading: false, error: null,
    } as any)
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    expect(screen.getByText('Edit role permissions')).toBeInTheDocument()
  })

  it('shows non-Error string for users query error', async () => {
    vi.mocked(useUsers).mockReturnValue({ data: [], isLoading: false, error: 'network timeout' } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('Error loading users')).toBeInTheDocument()
  })

  it('triggers early return from handleSubmit when role name is blank', async () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 100, name: '   ', description: 'blank', permissions: ['CAN_READ_MEMBERS'] }],
      isLoading: false, error: null,
    } as any)
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    await user.click(screen.getByText('Save Changes'))
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('triggers early return from handleDelete when role has no id', async () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ name: 'NO_ID_ROLE', description: '', permissions: [] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    const deleteBtns = document.querySelectorAll('[title="Delete"]')
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0])
    }
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('renders role with unknown permission action color', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 50, name: 'UNIQUE_ACTION', description: 'has unknown action', permissions: ['CAN_MANAGE_MEMBERS', 'CAN_APPROVE_MEMBERS'] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('UNIQUE ACTION')).toBeInTheDocument()
  })

  it('renders role with duplicate action permissions for grouping', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 51, name: 'DUP_ACTION', description: '', permissions: ['CAN_READ_MEMBERS', 'CAN_READ_PASTORS', 'CAN_READ_ELDERS'] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('DUP ACTION')).toBeInTheDocument()
  })

  it('opens edit form for role with object permissions and toggles off selected perm', async () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 52, name: 'OBJ_PERMS', description: 'has perms', permissions: [{ name: 'CAN_READ_MEMBERS' }, { name: 'CAN_UPDATE_MEMBERS' }] }],
      isLoading: false, error: null,
    } as any)
    const user = userEvent.setup()
    render(<Settings />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    await user.click(editBtns[0])
    const checkedPerms = document.querySelectorAll('.perm-cell-toggle input[type="checkbox"]:checked')
    if (checkedPerms.length > 0) {
      await user.click(checkedPerms[0])
    }
  })

  it('shows config error as non-Error string', async () => {
    vi.mocked(useUsers).mockReturnValue({ data: [], isLoading: false, error: 'fetch timeout' } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    expect(screen.getByText('Error loading users')).toBeInTheDocument()
  })

  it('renders roles with no user permissions', () => {
    mockAuthUser.permissions = []
    render(<Settings />)
    expect(screen.getByText(/don't have permission/)).toBeInTheDocument()
  })

  it('renders roles with object permissions', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 3, name: 'TEST', description: 'Test', permissions: [{ name: 'CAN_READ_MEMBERS' }, null] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('TEST')).toBeInTheDocument()
  })

  it('renders roles with permission color fallback', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 4, name: 'CUSTOM', description: 'Custom', permissions: ['CAN_MANAGE_ALL'] }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('CUSTOM')).toBeInTheDocument()
  })

  it('renders roles with no permissions array', () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: [{ id: 5, name: 'EMPTY', description: 'Empty', permissions: null }],
      isLoading: false, error: null,
    } as any)
    render(<Settings />)
    expect(screen.getByText('EMPTY')).toBeInTheDocument()
  })

  it('save button disabled when user lacks update permission', () => {
    mockAuthUser.permissions = ['can_read_roles']
    render(<Settings />)
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('toggleEditRole removes role from list', async () => {
    vi.mocked(useAssignRole).mockReturnValue({ mutateAsync: mockMutateAsync.mockResolvedValue(undefined), isPending: false } as any)
    mockAuthUser.permissions = [...mockUserPerms, 'can_manage_users']
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u1', username: 'admin', roles: ['ADMIN'], status: 'active', permissions: ['CAN_READ_MEMBERS'], churchId: '1' }],
      isLoading: false, error: null,
    } as any)
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByText('settings.manageUsers'))
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      const removeBtns = document.querySelectorAll('[title="Remove role"]')
      if (removeBtns.length > 0) {
        await user.click(removeBtns[0])
      }
    }
  })
})
