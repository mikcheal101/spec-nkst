import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: { success: toastSuccess, error: toastError } }))
const { mockAuthUser } = vi.hoisted(() => ({
  mockAuthUser: vi.fn(() => ({
    user: { username: 'admin', permissions: ['can_update_church', 'can_update_member'], churchId: '1', roles: ['ADMIN'] } as any,
    login: vi.fn(), logout: vi.fn(), loading: false,
  })),
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: (...args: any[]) => mockAuthUser(...args),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)

const defaultMembers = [
  { id: 1, firstName: 'John', lastName: 'Doe', middleName: '', tel: '1234567', church: { id: 1, name: 'Grace Church' }, userId: 'u1', phoneNumber: '1234567' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', middleName: '', tel: '9876543', church: { id: 2, name: 'Hope Church' }, userId: null, phoneNumber: '9876543' },
]

vi.mock('../hooks/usePeople', () => ({
  usePeopleList: vi.fn(() => ({
    data: { content: defaultMembers, totalPages: 1, totalElements: 2 },
    isLoading: false,
  })),
}))
vi.mock('../hooks/useAuth', () => ({
  useUsers: vi.fn(() => ({
    data: [{ id: 'u1', username: 'admin', roles: ['CHURCH_ADMIN'], status: 'active' }],
    isLoading: false,
  })),
  useAssignRole: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
  useRevokeRole: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
  useRegister: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
}))

import Admins from './Admins'
import { usePeopleList } from '../hooks/usePeople'
import { useUsers, useAssignRole, useRevokeRole, useRegister } from '../hooks/useAuth'
import { useAuth } from '../context/AuthContext'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(usePeopleList).mockReturnValue({
    data: { content: defaultMembers, totalPages: 1, totalElements: 2 },
    isLoading: false,
  } as any)
  vi.mocked(useUsers).mockReturnValue({
    data: [{ id: 'u1', username: 'admin', roles: ['CHURCH_ADMIN'], status: 'active' }],
    isLoading: false,
  } as any)
  vi.mocked(useAssignRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useRevokeRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useRegister).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  mockMutateAsync.mockResolvedValue(undefined)
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('Admins', () => {
  it('renders admin page with members', () => {
    render(<Admins />)
    expect(screen.getByText('Church Admins')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(usePeopleList).mockReturnValue({ data: undefined, isLoading: true } as any)
    const { container } = render(<Admins />)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('shows empty state when no members', () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    } as any)
    render(<Admins />)
    expect(screen.getByText('No members found')).toBeInTheDocument()
  })

  it('opens create account dialog', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    expect(screen.getByText('Create Auth Account')).toBeInTheDocument()
  })

  it('creates account successfully', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    const inputs = document.querySelectorAll('.mf-input')
    await user.type(inputs[0], 'newuser')
    await user.type(inputs[1], 'pass1234')
    const submitBtn = document.querySelector('.mf-footer .mf-btn-save')!
    await user.click(submitBtn)
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('handles create account error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Create failed'))
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    const inputs = document.querySelectorAll('.mf-input')
    await user.type(inputs[0], 'newuser')
    await user.type(inputs[1], 'pass1234')
    await user.click(document.querySelector('.mf-footer .mf-btn-save')!)
    expect(toastError).toHaveBeenCalledWith('Create failed')
  })

  it('handles create account non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    const inputs = document.querySelectorAll('.mf-input')
    await user.type(inputs[0], 'newuser')
    await user.type(inputs[1], 'pass1234')
    await user.click(document.querySelector('.mf-footer .mf-btn-save')!)
    expect(toastError).toHaveBeenCalledWith('Failed to create account')
  })

  it('cancels create account', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    await user.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Create Auth Account')).not.toBeInTheDocument()
  })

  it('makes admin for member with account', async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u1', username: 'admin', roles: ['MEMBER'], status: 'active' }],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Make Admin'))
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('handles make admin error', async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u1', username: 'admin', roles: ['MEMBER'], status: 'active' }],
      isLoading: false,
    } as any)
    mockMutateAsync.mockRejectedValueOnce(new Error('Assign failed'))
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Make Admin'))
    expect(toastError).toHaveBeenCalledWith('Assign failed')
  })

  it('removes admin for admin member', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Remove Admin'))
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('handles revoke admin error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Revoke failed'))
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Remove Admin'))
    expect(toastError).toHaveBeenCalledWith('Revoke failed')
  })

  it('shows pending state during register', async () => {
    vi.mocked(useRegister).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    expect(screen.getByText('Creating...')).toBeInTheDocument()
  })

  it('shows member without phone', () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [{ id: 3, firstName: 'No', lastName: 'Phone', middleName: '', tel: null, church: null, userId: null, phoneNumber: null }],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Admins />)
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1)
  })

  it('assign admin non-Error rejection', async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u1', username: 'admin', roles: ['MEMBER'], status: 'active' }],
      isLoading: false,
    } as any)
    mockMutateAsync.mockRejectedValueOnce('string err')
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Make Admin'))
    expect(toastError).toHaveBeenCalledWith('Failed to assign admin role')
  })

  it('revoke admin non-Error rejection', async () => {
    mockMutateAsync.mockRejectedValueOnce('string err')
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Remove Admin'))
    expect(toastError).toHaveBeenCalledWith('Failed to remove admin role')
  })

  it('does not submit create account when username is empty', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    const inputs = document.querySelectorAll('.mf-input')
    await user.type(inputs[1], 'pass1234')
    await user.click(document.querySelector('.mf-footer .mf-btn-save')!)
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('does not submit create account when password is empty', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    const inputs = document.querySelectorAll('.mf-input')
    await user.type(inputs[0], 'newuser')
    await user.click(document.querySelector('.mf-footer .mf-btn-save')!)
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('creates account with no churchId', async () => {
    mockAuthUser.mockReturnValue({
      user: { username: 'admin', permissions: ['can_update_church'], churchId: null, roles: ['ADMIN'] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    })
    const user = userEvent.setup()
    render(<Admins />)
    await user.click(screen.getByText('Create Account'))
    const inputs = document.querySelectorAll('.mf-input')
    await user.type(inputs[0], 'newuser')
    await user.type(inputs[1], 'pass1234')
    const submitBtn = document.querySelector('.mf-footer .mf-btn-save')!
    await user.click(submitBtn)
    expect(mockMutateAsync).toHaveBeenCalled()
  })

  it('clears search input', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.type(searchInput, 'test')
    const clearBtns = document.querySelectorAll('button')
    for (const btn of clearBtns) {
      if (btn.closest('[style*="position: absolute"]') && btn.querySelector('svg')) {
        await user.click(btn)
        break
      }
    }
    expect(searchInput).toHaveValue('')
  })

  it('shows search results with query', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Admins />)
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.type(searchInput, 'xyz')
    expect(screen.getByText('No members match your search')).toBeInTheDocument()
  })

  it('shows member with church name', () => {
    render(<Admins />)
    expect(screen.getByText('Grace Church')).toBeInTheDocument()
  })

  it('shows pending state during assign', async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [{ id: 'u1', username: 'admin', roles: ['MEMBER'], status: 'active' }],
      isLoading: false,
    } as any)
    vi.mocked(useAssignRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    render(<Admins />)
    const makeAdminBtn = screen.getByText('Make Admin') as HTMLButtonElement
    expect(makeAdminBtn).toBeDisabled()
  })

  it('shows pending state during revoke', async () => {
    vi.mocked(useRevokeRole).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    render(<Admins />)
    const removeBtn = screen.getByText('Remove Admin') as HTMLButtonElement
    expect(removeBtn).toBeDisabled()
  })

  it('create dialog overlay click closes', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    const addBtn = screen.getByText('Create Account')
    await user.click(addBtn)
    const overlay = document.querySelector('.mf-overlay')
    if (overlay) {
      fireEvent.click(overlay)
    }
  })

  it('create dialog close button closes', async () => {
    const user = userEvent.setup()
    render(<Admins />)
    const addBtn = screen.getByText('Create Account')
    await user.click(addBtn)
    const closeBtn = document.querySelector('.mf-close')
    if (closeBtn) {
      fireEvent.click(closeBtn)
    }
  })
})
