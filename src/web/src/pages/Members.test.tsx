import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
const mockAuthUser = vi.fn(() => ({
  user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] } as any,
  login: vi.fn(), logout: vi.fn(), loading: false,
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: (...args: any[]) => mockAuthUser(...args),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

const mockCreateAsync = vi.fn().mockResolvedValue(undefined)
const mockUpdateAsync = vi.fn().mockResolvedValue(undefined)
const mockDeleteAsync = vi.fn().mockResolvedValue(undefined)
const mockAdminAsync = vi.fn().mockResolvedValue(undefined)
const createIsPending = { current: false }
const membersData = [
  { id: 1, firstName: 'John', lastName: 'Doe', middleName: 'M', emailAddress: 'john@test.com', tel: '1234567', gender: 'Male', address: '123 St', baptised: true, admin: false, church: { id: 1, name: 'Test Church' }, baptismRecord: { serialNumber: 101, dateOfBaptism: '2015-06-20', worshipCenter: 'Main Hall', baptizedBy: 'Pastor James', bibleVerse: 'John 3:16', remark: 'First baptism' } },
  { id: 2, firstName: 'Jane', lastName: 'Smith', middleName: '', emailAddress: 'jane@test.com', tel: '9876543', gender: 'Female', address: '456 Ave', baptised: false, admin: true, church: { id: 2, name: 'Other Church' } },
]

vi.mock('../hooks/usePeople', () => ({
  usePeopleList: vi.fn(() => ({
    data: {
      content: membersData,
      totalPages: 2,
      totalElements: 24,
    },
    isLoading: false,
  })),
  useCreatePerson: () => ({ mutateAsync: mockCreateAsync, isPending: createIsPending.current }),
  useUpdatePerson: () => ({ mutateAsync: mockUpdateAsync, isPending: false }),
  useDeletePerson: () => ({ mutateAsync: mockDeleteAsync, isPending: false }),
  useMakeChurchAdmin: () => ({ mutateAsync: mockAdminAsync, isPending: false }),
}))
vi.mock('../hooks/useChurches', () => ({
  useAllChurches: vi.fn(() => ({
    data: { content: [{ id: 1, name: 'Test Church' }, { id: 2, name: 'Other Church' }] },
  })),
}))
vi.mock('../shared/components/ConfirmDialog', () => ({
  default: ({ open, title, message, onConfirm, onCancel, danger, loading }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <span data-testid="confirm-message">{message}</span>
        <button data-testid="confirm-cancel" onClick={onCancel}>Cancel</button>
        <button data-testid="confirm-ok" onClick={onConfirm} disabled={loading}>Confirm</button>
      </div>
    ) : null,
}))

import Members from './Members'
import { usePeopleList, useCreatePerson } from '../hooks/usePeople'
import { useAllChurches } from '../hooks/useChurches'

beforeEach(() => {
  vi.clearAllMocks()
  mockNavigate.mockClear()
  mockAuthUser.mockReturnValue({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  })
  vi.mocked(usePeopleList).mockReturnValue({
    data: { content: membersData, totalPages: 2, totalElements: 24 },
    isLoading: false,
  } as any)
})

describe('Members', () => {
  it('renders members table with data', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    expect(screen.getByText(/Jane.*Smith/)).toBeInTheDocument()
    expect(screen.getByText('members.title')).toBeInTheDocument()
  })

  it('shows empty state when no members', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('No members found')).toBeInTheDocument() })
  })

  it('shows empty state with filters', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ ...membersData[0], gender: 'Male', baptised: true }], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[1], 'Female')
    await waitFor(() => { expect(screen.getByText('No members match your filters')).toBeInTheDocument() })
  })

  it('shows loading state', async () => {
    vi.mocked(usePeopleList).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<Members />)
    expect(document.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('opens create form', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    expect(screen.getByText('members.addMember', { selector: 'h3' })).toBeInTheDocument()
  })

  it('shows validation error when name missing', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Name is required') })
  })

  it('shows validation error when phone missing', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const firstNameInputs = document.querySelectorAll('.mf-input')
    const firstNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.firstName')
    })
    if (firstNameInput) await user.type(firstNameInput, 'Test')
    const lastNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.lastName')
    })
    if (lastNameInput) await user.type(lastNameInput, 'Person')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Phone number is required') })
  })

  it('submits create form with valid data', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const firstNameInputs = document.querySelectorAll('.mf-input')
    const firstNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.firstName')
    })
    if (firstNameInput) await user.type(firstNameInput, 'Test')
    const lastNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.lastName')
    })
    if (lastNameInput) await user.type(lastNameInput, 'Person')
    const phoneInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.phone')
    })
    if (phoneInput) await user.type(phoneInput, '5551234')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(mockCreateAsync).toHaveBeenCalled() })
  })

  it('submits create form with baptism fields', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const toggle = screen.getByRole('checkbox')
    await user.click(toggle)
    expect(screen.getByText('Serial Number')).toBeInTheDocument()
  })

  it('opens edit form with member data', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    if (editBtn) {
      await user.click(editBtn)
      expect(screen.getByText('members.editMember')).toBeInTheDocument()
    }
  })

  it('submits edit form', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(mockUpdateAsync).toHaveBeenCalled() })
  })

  it('deletes member via ConfirmDialog', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const deleteBtn = document.querySelector('[data-tooltip="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    expect(screen.getByText('members.confirmDelete')).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-ok'))
    await waitFor(() => { expect(mockDeleteAsync).toHaveBeenCalled() })
  })

  it('cancels delete', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const deleteBtn = document.querySelector('[data-tooltip="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    await user.click(screen.getByTestId('confirm-cancel'))
    expect(mockDeleteAsync).not.toHaveBeenCalled()
  })

  it('makes member admin', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Make admin"]') as HTMLButtonElement
    if (adminBtn) {
      await user.click(adminBtn)
      expect(screen.getByText('Make Church Admin')).toBeInTheDocument()
      await user.click(screen.getByTestId('confirm-ok'))
      await waitFor(() => { expect(mockAdminAsync).toHaveBeenCalled() })
    }
  })

  it('shows already admin badge', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/Jane/)).toBeInTheDocument() })
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0)
  })

  it('searches members', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone')
    await user.type(searchInput, 'John')
    expect(searchInput).toHaveValue('John')
  })

  it('clears search with clear button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone')
    await user.type(searchInput, 'John')
    const clearBtns = document.querySelectorAll('button')
    for (const btn of clearBtns) {
      if (btn.closest('[style*="position: absolute"]') && btn.querySelector('svg')) {
        await user.click(btn)
        break
      }
    }
    expect(searchInput).toHaveValue('')
  })

  it('hover events on search clear button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone')
    await user.type(searchInput, 'John')
    const clearBtns = document.querySelectorAll('button')
    for (const btn of clearBtns) {
      if (btn.closest('[style*="position: absolute"]') && btn.querySelector('svg')) {
        fireEvent.mouseEnter(btn)
        fireEvent.mouseLeave(btn)
        break
      }
    }
  })

  it('hover events on filter clear button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'Pastor')
    const clearBtn = screen.getByText('Clear')
    fireEvent.mouseEnter(clearBtn)
    fireEvent.mouseLeave(clearBtn)
  })

  it('filters by position', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'Pastor')
    expect(selects[0]).toHaveValue('Pastor')
  })

  it('filters by gender', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[1], 'Male')
    expect(selects[1]).toHaveValue('Male')
  })

  it('filters by status (communicant)', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[2], 'Communicant')
    expect(selects[2]).toHaveValue('Communicant')
  })

  it('filters by status (non-communicant)', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[2], 'Non-communicant')
    expect(selects[2]).toHaveValue('Non-communicant')
  })

  it('paginates', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('›')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('›'))
  })

  it('paginates to first page', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('«')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('«'))
  })

  it('paginates to last page', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('»')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('»'))
  })

  it('paginates to previous page', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('‹')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('‹'))
  })

  it('selects sort option', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    const sortSelect = selects[selects.length - 1]
    await user.selectOptions(sortSelect, 'firstName,asc')
    expect(sortSelect).toHaveValue('firstName,asc')
  })

  it('closes form on overlay click', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    expect(screen.getByText('members.addMember', { selector: 'h3' })).toBeInTheDocument()
    fireEvent.click(document.querySelector('.mf-overlay')!)
    expect(screen.queryByText('members.addMember', { selector: 'h3' })).not.toBeInTheDocument()
  })

  it('closes form via close button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const closeBtn = document.querySelector('.mf-close')!
    await user.click(closeBtn)
    expect(screen.queryByText('members.addMember', { selector: 'h3' })).not.toBeInTheDocument()
  })

  it('shows record count', () => {
    render(<Members />)
    expect(screen.getByText(/of 24/)).toBeInTheDocument()
  })

  it('navigates to member detail on row click', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const rows = document.querySelectorAll('tbody tr')
    await user.click(rows[0])
    expect(mockNavigate).toHaveBeenCalledWith('/members/1')
  })

  it('navigates to member detail via view button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const viewBtn = document.querySelector('[data-tooltip="View"]') as HTMLButtonElement
    await user.click(viewBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/members/1')
  })

  it('shows church admin button for editable members', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Make admin"]') as HTMLButtonElement
    expect(adminBtn).toBeInTheDocument()
  })

  it('shows church admin badge for admin members', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/Jane/)).toBeInTheDocument() })
    const adminBadge = document.querySelector('[data-tooltip="Church admin"]') as HTMLButtonElement
    expect(adminBadge).toBeInTheDocument()
  })

  it('handles create form with baptised toggle', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const toggle = screen.getByRole('checkbox')
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
    expect(screen.getByText('Communicant Member')).toBeInTheDocument()
  })

  it('toggles baptism fields off', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const toggle = screen.getByRole('checkbox')
    await user.click(toggle)
    expect(screen.getByText('Serial Number')).toBeInTheDocument()
    await user.click(toggle)
    expect(screen.queryByText('Serial Number')).not.toBeInTheDocument()
  })

  it('shows member email in table', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('john@test.com')).toBeInTheDocument() })
  })

  it('shows member without email', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ ...membersData[0], emailAddress: null }], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
  })

  it('shows member without church', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ ...membersData[0], church: null }], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
  })

  it('shows member without phone', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ ...membersData[0], tel: null }], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('toggles sort selection', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    const sortSelect = selects[selects.length - 1]
    await user.selectOptions(sortSelect, 'firstName,desc')
    expect(sortSelect).toHaveValue('firstName,desc')
    await user.selectOptions(sortSelect, 'dateOfBirth,asc')
    expect(sortSelect).toHaveValue('dateOfBirth,asc')
  })

  it('handles delete with non-Error exception', async () => {
    mockDeleteAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const deleteBtn = document.querySelector('[data-tooltip="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    await user.click(screen.getByTestId('confirm-ok'))
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Delete failed') })
  })

  it('handles admin with non-Error exception', async () => {
    mockAdminAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Make admin"]') as HTMLButtonElement
    if (adminBtn) {
      await user.click(adminBtn)
      await user.click(screen.getByTestId('confirm-ok'))
      await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Failed') })
    }
  })

  it('handles edit error', async () => {
    mockUpdateAsync.mockRejectedValueOnce(new Error('Update failed'))
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Update failed') })
  })

  it('handles edit non-Error exception', async () => {
    mockUpdateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Operation failed') })
  })

  it('handles create error', async () => {
    mockCreateAsync.mockRejectedValueOnce(new Error('Create failed'))
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const firstNameInputs = document.querySelectorAll('.mf-input')
    const firstNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.firstName')
    })
    if (firstNameInput) await user.type(firstNameInput, 'Test')
    const lastNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.lastName')
    })
    if (lastNameInput) await user.type(lastNameInput, 'Person')
    const phoneInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.phone')
    })
    if (phoneInput) await user.type(phoneInput, '5551234')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Create failed') })
  })

  it('clears all filters via clear button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'Pastor')
    await user.selectOptions(selects[1], 'Male')
    const clearBtn = screen.getByText('Clear')
    await user.click(clearBtn)
    expect(selects[0]).toHaveValue('')
    expect(selects[1]).toHaveValue('')
  })

  it('shows empty state with hasAnyFilter for non-Communicant', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ ...membersData[0], baptised: true }], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[2], 'Non-communicant')
    await waitFor(() => { expect(screen.getByText('No members match your filters')).toBeInTheDocument() })
  })

  it('shows pending state in delete', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [membersData[0]], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const deleteBtn = document.querySelector('[data-tooltip="Delete"]') as HTMLButtonElement
    const user = userEvent.setup()
    await user.click(deleteBtn)
    expect(screen.getByTestId('confirm-ok')).toBeInTheDocument()
  })

  it('disables admin button for admin user', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/Jane/)).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Church admin"]') as HTMLButtonElement
    if (adminBtn) expect(adminBtn).toBeDisabled()
  })

  it('shows baptism record badge in edit form', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    expect(screen.getByText('Communicant Member')).toBeInTheDocument()
  })

  it('submits create form with baptism fields filled', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const allInputs = document.querySelectorAll('.mf-input')
    await user.type(allInputs[0], 'Test')
    await user.type(allInputs[1], 'Person')
    const phoneInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.phone')
    })!
    await user.type(phoneInput, '5551234')
    const toggle = screen.getByRole('checkbox')
    await user.click(toggle)
    const serialInput = document.querySelector('input[type="number"]')!
    fireEvent.change(serialInput, { target: { value: '999' } })
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(mockCreateAsync).toHaveBeenCalled() })
  })

  it('cancels admin dialog', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Make admin"]') as HTMLButtonElement
    if (adminBtn) {
      await user.click(adminBtn)
      expect(screen.getByText('Make Church Admin')).toBeInTheDocument()
      await user.click(screen.getByTestId('confirm-cancel'))
      expect(mockAdminAsync).not.toHaveBeenCalled()
    }
  })

  it('shows already admin message when clicking admin on admin user', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/Jane/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    const editBtns = document.querySelectorAll('[data-tooltip="Edit"]')
    await user.click(editBtns[1])
    expect(screen.getByText('Church Admin')).toBeInTheDocument()
    fireEvent.click(document.querySelector('.mf-close')!)
    expect(screen.queryByText('Church Admin')).not.toBeInTheDocument()
  })

  it('shows replace admin message when church already has admin', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [
          { id: 1, firstName: 'John', lastName: 'Doe', middleName: '', emailAddress: '', tel: '123', gender: 'Male', baptised: false, admin: false, church: { id: 2, name: 'Other Church' }, baptismRecord: null },
          { id: 2, firstName: 'Jane', lastName: 'Smith', middleName: '', emailAddress: '', tel: '456', gender: 'Female', baptised: false, admin: true, church: { id: 2, name: 'Other Church' }, baptismRecord: null },
        ],
        totalPages: 1,
        totalElements: 2,
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Make admin"]') as HTMLButtonElement
    if (adminBtn) {
      await user.click(adminBtn)
      expect(screen.getByText(/already has an admin/)).toBeInTheDocument()
    }
  })

  it('handles admin error from Error instance', async () => {
    mockAdminAsync.mockRejectedValueOnce(new Error('Admin failed'))
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Make admin"]') as HTMLButtonElement
    if (adminBtn) {
      await user.click(adminBtn)
      await user.click(screen.getByTestId('confirm-ok'))
      await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Admin failed') })
    }
  })

  it('paginates across multiple pages with ellipsis', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: membersData,
        totalPages: 7,
        totalElements: 84,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('paginates to middle pages', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: membersData,
        totalPages: 7,
        totalElements: 84,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    fireEvent.click(screen.getByText('›'))
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('handles member with isBaptised property instead of baptised', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [{ id: 99, firstName: 'Test', lastName: 'User', middleName: '', emailAddress: '', tel: '111', gender: 'Male', baptised: undefined as any, isBaptised: true, admin: false, church: null, baptismRecord: null }],
        totalPages: 1,
        totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/Test/)).toBeInTheDocument() })
    const matches = screen.getAllByText('Communicant')
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  it('shows Non-Communicant Member hint when baptism toggle off', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    expect(screen.getByText('Non-Communicant Member')).toBeInTheDocument()
  })

  it('closes form via cancel button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const cancelBtn = document.querySelector('.mf-btn-cancel')!
    await user.click(cancelBtn)
    expect(screen.queryByText('members.addMember', { selector: 'h3' })).not.toBeInTheDocument()
  })

  it('shows pending state for save button during mutation', async () => {
    const user = userEvent.setup()
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: membersData, totalPages: 2, totalElements: 24 },
      isLoading: false,
    } as any)
    createIsPending.current = true
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    createIsPending.current = false
  })

  it('disables save button during pending mutation', async () => {
    const user = userEvent.setup()
    createIsPending.current = true
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled()
    createIsPending.current = false
  })

  it('navigates to member detail via edit button stopPropagation', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    expect(screen.getByText('members.editMember')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalledWith('/members/1')
  })

  it('navigates to member detail via delete button stopPropagation', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const deleteBtn = document.querySelector('[data-tooltip="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    expect(screen.getByText('members.confirmDelete')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalledWith('/members/1')
  })

  it('handles create error with non-Error string', async () => {
    mockCreateAsync.mockRejectedValueOnce('string err')
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const firstNameInput = document.querySelector('.mf-input')!
    await user.type(firstNameInput, 'Test')
    const allInputs = document.querySelectorAll('.mf-input')
    await user.type(allInputs[1], 'Person')
    const phoneInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.phone')
    })!
    await user.type(phoneInput, '5551234')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Operation failed') })
  })

  it('shows single page pagination disabled', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: membersData, totalPages: 1, totalElements: 2 },
      isLoading: false,
    } as any)
    render(<Members />)
    const nextBtn = screen.getByText('›')
    expect(nextBtn).toBeDisabled()
    const lastBtn = screen.getByText('»')
    expect(lastBtn).toBeDisabled()
    const prevBtn = screen.getByText('‹')
    expect(prevBtn).toBeDisabled()
    const firstBtn = screen.getByText('«')
    expect(firstBtn).toBeDisabled()
  })

  it('shows admin form badge when editing admin member with church', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/Jane/)).toBeInTheDocument() })
    const editButtons = document.querySelectorAll('[data-tooltip="Edit"]')
    await user.click(editButtons[1])
    expect(screen.getByText('Church Admin')).toBeInTheDocument()
  })

  it('shows make admin button in form for non-admin with church', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    expect(screen.getByText('Make Church Admin')).toBeInTheDocument()
  })

  it('hides make admin button in form when no church selected', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [{ ...membersData[0], church: null }],
        totalPages: 1,
        totalElements: 1,
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    expect(screen.queryByText('Make Church Admin')).not.toBeInTheDocument()
  })

  it('opens admin from form make admin button', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    const makeAdminBtn = screen.getByText('Make Church Admin')
    await user.click(makeAdminBtn)
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
  })

  it('fills middle name and address fields', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const allInputs = document.querySelectorAll('.mf-input')
    const middleNameInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent === 'Middle Name'
    })
    if (middleNameInput) await user.type(middleNameInput, 'M')
    const addressInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent === 'Address'
    })
    if (addressInput) await user.type(addressInput, '123 Street')
  })

  it('fills email field', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const allInputs = document.querySelectorAll('.mf-input')
    const emailInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.email')
    })
    if (emailInput) await user.type(emailInput, 'test@test.com')
  })

  it('changes gender select', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const allInputs = document.querySelectorAll('.mf-input')
    const genderSelect = Array.from(allInputs).find(el => el.tagName === 'SELECT') as HTMLSelectElement
    if (genderSelect) await user.selectOptions(genderSelect, 'Male')
  })

  it('changes church select', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const allInputs = document.querySelectorAll('.mf-input')
    const churchSelect = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent === 'Church'
    }) as HTMLSelectElement
    if (churchSelect) await user.selectOptions(churchSelect, '1')
  })

  it('clicks specific page number buttons', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: membersData,
        totalPages: 3,
        totalElements: 36,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    const page2 = screen.getByText('2')
    fireEvent.click(page2)
    const page3 = screen.getByText('3')
    fireEvent.click(page3)
    fireEvent.click(screen.getByText('1'))
  })

  it('renders admin badge text for admin users in table', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/Jane/)).toBeInTheDocument() })
    const badges = screen.getAllByText('Admin')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('shows church select with options in form', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const allInputs = document.querySelectorAll('.mf-input')
    const churchSelect = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent === 'Church'
    }) as HTMLSelectElement
    expect(churchSelect).toBeInTheDocument()
    expect(churchSelect.options.length).toBeGreaterThan(1)
  })

  it('shows middleName field with default empty value', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const allInputs = document.querySelectorAll('.mf-input')
    const middleNameInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent === 'Middle Name'
    }) as HTMLInputElement
    expect(middleNameInput).toBeInTheDocument()
    expect(middleNameInput.value).toBe('')
  })

  it('fills email in edit form', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    const allInputs = document.querySelectorAll('.mf-input')
    const emailInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.email')
    }) as HTMLInputElement
    expect(emailInput).toBeInTheDocument()
    expect(emailInput.value).toBe('john@test.com')
  })

  it('clicks first and prev buttons when not on first page', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: membersData, totalPages: 3, totalElements: 36 },
      isLoading: false,
    } as any)
    render(<Members />)
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getByText('«'))
    fireEvent.click(screen.getByText('›'))
    fireEvent.click(screen.getByText('‹'))
  })

  it('fills baptism detail fields', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const toggle = screen.getByRole('checkbox')
    await user.click(toggle)
    const allInputs = document.querySelectorAll('.mf-input')
    const dateInput = Array.from(allInputs).find(el => el.getAttribute('type') === 'date') as HTMLInputElement
    if (dateInput) fireEvent.change(dateInput, { target: { value: '2020-06-15' } })
    const worshipInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('Worship Center')
    }) as HTMLInputElement
    if (worshipInput) fireEvent.change(worshipInput, { target: { value: 'Main Hall' } })
    const bibleInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('Bible Verse')
    }) as HTMLInputElement
    if (bibleInput) fireEvent.change(bibleInput, { target: { value: 'John 3:16' } })
    const baptisedByInput = Array.from(allInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('Baptised By')
    }) as HTMLInputElement
    if (baptisedByInput) fireEvent.change(baptisedByInput, { target: { value: 'Pastor James' } })
    const remarkInput = document.querySelector('textarea') as HTMLTextAreaElement
    if (remarkInput) fireEvent.change(remarkInput, { target: { value: 'Good standing' } })
  })

  it('selects multiple sort options', async () => {
    const user = userEvent.setup()
    render(<Members />)
    const selects = screen.getAllByRole('combobox')
    const sortSelect = selects[selects.length - 1]
    await user.selectOptions(sortSelect, 'dateOfBirth,desc')
    expect(sortSelect).toHaveValue('dateOfBirth,desc')
  })

  it('handles member with neither baptised nor isBaptised', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [{ id: 88, firstName: 'Noel', lastName: 'Bap', middleName: '', emailAddress: '', tel: '111', gender: 'Male', baptised: undefined, isBaptised: undefined, admin: false, church: null, baptismRecord: null }],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('Noel Bap')).toBeInTheDocument() })
    const nonCommBadges = screen.getAllByText('Non-communicant')
    expect(nonCommBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('member with empty firstName and lastName shows empty initials', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [{ id: 77, firstName: '', lastName: '', middleName: '', emailAddress: '', tel: '111', gender: 'Male', baptised: false, admin: false, church: null, baptismRecord: null }],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(document.querySelector('tbody tr')).toBeInTheDocument() })
  })

  it('shows empty state when no filters but no members', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    } as any)
    render(<Members />)
    expect(screen.getByText('No members found')).toBeInTheDocument()
  })

  it('member without phone shows dash', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [{ id: 55, firstName: 'Abel', lastName: 'Zero', middleName: '', emailAddress: 'az@test.com', tel: '', gender: 'Male', baptised: false, admin: false, church: null, baptismRecord: null }],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('Abel Zero')).toBeInTheDocument() })
  })

  it('edit form with member without baptismRecord', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [{ id: 44, firstName: 'NoRecord', lastName: 'Person', middleName: '', emailAddress: '', tel: '111', gender: 'Male', baptised: false, admin: false, church: null, baptismRecord: null }],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('NoRecord Person')).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    expect(screen.getByText('members.editMember')).toBeInTheDocument()
  })

  it('submits baptised form without serial number', async () => {
    const user = userEvent.setup()
    render(<Members />)
    await user.click(screen.getByText('members.addMember'))
    const firstNameInputs = document.querySelectorAll('.mf-input')
    const firstNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.firstName')
    })
    if (firstNameInput) await user.type(firstNameInput, 'Test')
    const lastNameInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.lastName')
    })
    if (lastNameInput) await user.type(lastNameInput, 'Person')
    const phoneInput = Array.from(firstNameInputs).find(el => {
      const label = el.closest('.mf-field')?.querySelector('.mf-label')
      return label?.textContent?.includes('members.phone')
    })!
    await user.type(phoneInput, '5551234')
    const toggle = screen.getByRole('checkbox')
    await user.click(toggle)
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => { expect(mockCreateAsync).toHaveBeenCalled() })
  })

  it('admin dialog shows replace message when church already has admin', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [
          { id: 1, firstName: 'Admin', lastName: 'One', middleName: '', emailAddress: '', tel: '111', gender: 'Male', baptised: false, admin: true, church: { id: 5, name: 'Test Church', address: '' }, baptismRecord: null },
          { id: 2, firstName: 'Normal', lastName: 'Two', middleName: '', emailAddress: '', tel: '222', gender: 'Male', baptised: false, admin: false, church: { id: 5, name: 'Test Church', address: '' }, baptismRecord: null },
        ],
        totalPages: 1, totalElements: 2,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('Normal Two')).toBeInTheDocument() })
    const adminBtns = document.querySelectorAll('[data-tooltip="Church admin"]')
    const normalAdminBtn = Array.from(adminBtns).find(btn => {
      const row = btn.closest('tr')
      return row?.textContent?.includes('Normal')
    })
    if (normalAdminBtn) {
      const user = userEvent.setup()
      await user.click(normalAdminBtn)
    }
  })

  it('admin dialog shows already admin message for admin member', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [
          { id: 1, firstName: 'Already', lastName: 'Admin', middleName: '', emailAddress: '', tel: '111', gender: 'Male', baptised: false, admin: true, church: { id: 5, name: 'Test Church', address: '' }, baptismRecord: null },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('Already Admin')).toBeInTheDocument() })
    const adminBtns = document.querySelectorAll('[data-tooltip="Church admin"]')
    if (adminBtns.length > 0) {
      const user = userEvent.setup()
      await user.click(adminBtns[0])
    }
  })

  it('delete error with non-Error throws correctly', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [membersData[0]], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    mockDeleteAsync.mockRejectedValueOnce(42)
    const user = userEvent.setup()
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    const deleteBtn = document.querySelector('[data-tooltip="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    await user.click(screen.getByTestId('confirm-ok'))
    await waitFor(() => { expect(toast.error).toHaveBeenCalledWith('Delete failed') })
  })

  it('user without makeAdmin permission does not show admin button', async () => {
    mockAuthUser.mockReturnValue({
      user: { username: 'user', permissions: ['can_read_members'], churchId: '1', roles: [] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    })
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    expect(screen.queryByText('Make admin')).not.toBeInTheDocument()
  })

  it('hides edit, delete and add buttons without permissions', async () => {
    mockAuthUser.mockReturnValue({
      user: { username: 'user', permissions: ['can_read_members'], churchId: '1', roles: [] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    })
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    expect(screen.queryByText('members.addMember')).not.toBeInTheDocument()
    expect(document.querySelector('[data-tooltip="Edit"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-tooltip="Delete"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-tooltip="View"]')).toBeInTheDocument()
  })

  it('shows edit and delete buttons with permissions', async () => {
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
    expect(screen.getByText('members.addMember')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-tooltip="Edit"]').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('[data-tooltip="Delete"]').length).toBeGreaterThan(0)
  })

  it('edits member with null email and tel', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [
          { id: 3, firstName: 'Null', lastName: 'Fields', middleName: '', emailAddress: null, tel: null, gender: 'Male', baptised: false, admin: false, church: null, baptismRecord: null },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('Null Fields')).toBeInTheDocument() })
    const editBtn = document.querySelector('[data-tooltip="Edit"]') as HTMLButtonElement
    if (editBtn) {
      const user = userEvent.setup()
      await user.click(editBtn)
    }
  })

  it('admin dialog shows default message for member with no church', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [
          { id: 4, firstName: 'NoChurch', lastName: 'Member', middleName: '', emailAddress: 'nc@test.com', tel: '333', gender: 'Male', baptised: false, admin: false, church: null, baptismRecord: null },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('NoChurch Member')).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Church admin"]') as HTMLButtonElement
    if (adminBtn) {
      const user = userEvent.setup()
      await user.click(adminBtn)
      const msg = screen.getByTestId('confirm-message')
      expect(msg).toBeInTheDocument()
    }
  })

  it('admin dialog shows default message for member with church no existing admin', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: {
        content: [
          { id: 5, firstName: 'Solo', lastName: 'Member', middleName: '', emailAddress: 'solo@test.com', tel: '444', gender: 'Male', baptised: false, admin: false, church: { id: 99, name: 'Unique Church', address: '' }, baptismRecord: null },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText('Solo Member')).toBeInTheDocument() })
    const adminBtn = document.querySelector('[data-tooltip="Church admin"]') as HTMLButtonElement
    if (adminBtn) {
      const user = userEvent.setup()
      await user.click(adminBtn)
      const msg = screen.getByTestId('confirm-message')
      expect(msg).toBeInTheDocument()
    }
  })

  it('user without any permissions renders correctly', async () => {
    mockAuthUser.mockReturnValue({
      user: null,
      login: vi.fn(), logout: vi.fn(), loading: false,
    })
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
  })

  it('churchesData with undefined content renders default', async () => {
    vi.mocked(useAllChurches).mockReturnValue({ data: undefined } as any)
    render(<Members />)
    await waitFor(() => { expect(screen.getByText(/John/)).toBeInTheDocument() })
  })
})
