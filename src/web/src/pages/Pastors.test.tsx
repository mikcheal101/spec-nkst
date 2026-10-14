import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
vi.mock('../hooks/usePeople', () => ({
  usePastorsList: vi.fn(),
  useCreatePastor: vi.fn(),
  useUpdatePastor: vi.fn(),
  useDeletePastor: vi.fn(),
  usePastorRoles: vi.fn(),
  usePeopleList: vi.fn(),
}))
vi.mock('../hooks/useChurches', () => ({
  useAllChurches: vi.fn(() => ({
    data: { content: [{ id: 1, name: 'Grace Church' }, { id: 2, name: 'Hope Church' }] },
  })),
}))

import Pastors from './Pastors'
import { usePastorsList, useCreatePastor, useDeletePastor, useUpdatePastor, usePastorRoles, usePeopleList } from '../hooks/usePeople'
import { useAllChurches } from '../hooks/useChurches'

const defaultPastorsData = [
  { id: 1, firstName: 'Pastor John', lastName: 'Doe', middleName: '', email: 'pastor@test.com', phoneNumber: '1111111', gender: 'Male', position: 'Senior Pastor', church: { id: 1, name: 'Grace Church' }, pastorRoleId: 1 },
  { id: 2, firstName: 'Pastor Jane', lastName: 'Smith', middleName: '', email: 'pastorj@test.com', phoneNumber: '2222222', gender: 'Female', position: 'Assistant Pastor', church: { id: 1, name: 'Grace Church' }, pastorRoleId: 2 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockNavigate.mockClear()
  mockMutateAsync.mockReset().mockResolvedValue(undefined)
  vi.mocked(usePastorsList).mockReturnValue({ data: defaultPastorsData, isLoading: false } as any)
  vi.mocked(useCreatePastor).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useUpdatePastor).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useDeletePastor).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(usePastorRoles).mockReturnValue({ data: [{ id: 1, name: 'Senior Pastor' }, { id: 2, name: 'Assistant Pastor' }] } as any)
  vi.mocked(usePeopleList).mockReturnValue({ data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 2 } } as any)
})

describe('Pastors', () => {
  it('renders pastors list', () => {
    render(<Pastors />)
    expect(screen.getByText('Pastor John Doe')).toBeInTheDocument()
    expect(screen.getByText('Pastor Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('2', { selector: '.subtitle-count' })).toBeInTheDocument()
  })

  it('shows singular for one pastor', () => {
    vi.mocked(usePastorsList).mockReturnValue({
      data: [{ id: 1, firstName: 'A', lastName: 'B', middleName: '', email: '', phoneNumber: '', gender: 'Male', position: 'Senior Pastor', church: { id: 1, name: 'G' }, pastorRoleId: 1 }],
      isLoading: false,
    } as any)
    render(<Pastors />)
    expect(screen.getByText('1', { selector: '.subtitle-count' })).toBeInTheDocument()
  })

  it('shows empty state when no pastors', () => {
    vi.mocked(usePastorsList).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Pastors />)
    expect(screen.getByText('No pastors found')).toBeInTheDocument()
    expect(screen.getByText('Add your first pastor to get started')).toBeInTheDocument()
  })

  it('shows empty state with search filter', () => {
    vi.mocked(usePastorsList).mockReturnValue({
      data: [{ id: 1, firstName: 'A', lastName: 'B', middleName: '', email: '', phoneNumber: '', gender: '', position: 'Senior Pastor', church: null, pastorRoleId: 1 }],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(usePastorsList).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<Pastors />)
    expect(document.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('opens create form', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    expect(screen.getByText('Add Pastor', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.getByText('Add a new church pastor')).toBeInTheDocument()
  })

  it('closes create form via cancel', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const cancelBtn = screen.getByText('Cancel')
    await user.click(cancelBtn)
    expect(screen.queryByText('Add a new church pastor')).not.toBeInTheDocument()
  })

  it('closes create form via overlay click', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    fireEvent.click(document.querySelector('.mf-overlay')!)
    expect(screen.queryByText('Add a new church pastor')).not.toBeInTheDocument()
  })

  it('closes create form via close button', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const closeBtn = document.querySelector('.mf-close')!
    await user.click(closeBtn)
    expect(screen.queryByText('Add a new church pastor')).not.toBeInTheDocument()
  })

  it('validates create form - no member selected', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    fireEvent.submit(document.querySelector('form')!)
    expect(toast.error).toHaveBeenCalledWith('Please select a member')
  })

  it('validates create form - no role selected', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    fireEvent.submit(document.querySelector('form')!)
    expect(toast.error).toHaveBeenCalledWith('Pastor role is required')
  })

  it('validates create form - no church selected', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    fireEvent.submit(document.querySelector('form')!)
    expect(toast.error).toHaveBeenCalledWith('Church is required')
  })

  it('creates a pastor successfully', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
  })

  it('handles create error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Create failed'))
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Create failed'))
  })

  it('handles create error non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('string err')
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Operation failed'))
  })

  it('opens edit form', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    expect(screen.getByText('Edit Pastor')).toBeInTheDocument()
    expect(screen.getByText('Update pastor information')).toBeInTheDocument()
  })

  it('edits a pastor successfully', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
  })

  it('deletes a pastor', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    expect(screen.getByText('Delete this pastor?')).toBeInTheDocument()
  })

  it('confirms delete', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
  })

  it('handles delete error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<Pastors />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete failed'))
  })

  it('handles delete non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<Pastors />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete failed'))
  })

  it('cancels delete', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    const cancelBtn = screen.getByText('common.cancel')
    await user.click(cancelBtn)
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('searches pastors', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    await user.type(searchInput, 'John')
    expect(searchInput).toHaveValue('John')
  })

  it('clears search', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    await user.type(searchInput, 'test')
    const clearBtn = document.querySelector('.search-clear')!
    await user.click(clearBtn)
    expect(searchInput).toHaveValue('')
  })

  it('toggles sort', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('A–Z'))
    expect(screen.getByText('Z–A')).toBeInTheDocument()
  })

  it('toggles sort back', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('A–Z'))
    await user.click(screen.getByText('Z–A'))
    expect(screen.getByText('A–Z')).toBeInTheDocument()
  })

  it('filters by role tab', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByRole('button', { name: 'Assistant Pastor' }))
    expect(screen.getByText('Pastor Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('Pastor John Doe')).not.toBeInTheDocument()
  })

  it('resets to All tab', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByRole('button', { name: 'Assistant Pastor' }))
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Pastor John Doe')).toBeInTheDocument()
  })

  it('navigates to detail on row click', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const rows = document.querySelectorAll('tbody tr')
    await user.click(rows[0])
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('navigates to detail via view button', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    const viewBtn = document.querySelector('[title="View"]') as HTMLButtonElement
    await user.click(viewBtn)
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('paginates', async () => {
    const manyPastors = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1, firstName: `P${i + 1}`, lastName: `L${i + 1}`, middleName: '', email: '', phoneNumber: '',
      gender: 'Male', position: 'Senior Pastor', church: { id: 1, name: 'Grace Church' }, pastorRoleId: 1,
    }))
    vi.mocked(usePastorsList).mockReturnValue({ data: manyPastors, isLoading: false } as any)
    render(<Pastors />)
    expect(screen.getByText('20 records')).toBeInTheDocument()
  })

  it('shows member search in form', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.type(searchInput, 'test')
    expect(searchInput).toHaveValue('test')
  })

  it('shows empty member search', async () => {
    vi.mocked(usePeopleList).mockReturnValue({ data: { content: [], totalPages: 0 } } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('No matching members')).toBeInTheDocument()
  })

  it('paginates member dropdown', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 3 },
    } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('shows pending state during create', async () => {
    vi.mocked(useCreatePastor).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows church name in row', () => {
    render(<Pastors />)
    expect(screen.getAllByText('Grace Church').length).toBeGreaterThan(0)
  })

  it('shows pastor without church', () => {
    vi.mocked(usePastorsList).mockReturnValue({
      data: [{ id: 3, firstName: 'X', lastName: 'Y', middleName: '', email: '', phoneNumber: '', gender: '', position: '', church: null, pastorRoleId: 1 }],
      isLoading: false,
    } as any)
    render(<Pastors />)
    expect(screen.getByText('Pastor', { selector: '.role-badge' })).toBeInTheDocument()
  })

  it('selects member from dropdown', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    expect(searchInput).toHaveValue('John Member')
  })

  it('shows pending state during delete', async () => {
    vi.mocked(useDeletePastor).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    await user.click(deleteBtn)
    expect(screen.getByText('Delete this pastor?')).toBeInTheDocument()
    expect(document.querySelector('.mf-spinner')).toBeInTheDocument()
  })

  it('handles undefined churchPage data', () => {
    vi.mocked(useAllChurches).mockReturnValue({ data: undefined } as any)
    render(<Pastors />)
    expect(screen.getByText('Pastor John Doe')).toBeInTheDocument()
  })

  it('handles undefined memberPageData', async () => {
    vi.mocked(usePeopleList).mockReturnValue({ data: undefined } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('No matching members')).toBeInTheDocument()
  })

  it('searches by phone number', () => {
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    fireEvent.change(searchInput, { target: { value: '2222222' } })
    expect(screen.getByText('Pastor Jane Smith')).toBeInTheDocument()
  })

  it('searches by email', () => {
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    fireEvent.change(searchInput, { target: { value: 'pastor@test.com' } })
    expect(screen.getByText('Pastor John Doe')).toBeInTheDocument()
  })

  it('searches by church name', () => {
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    fireEvent.change(searchInput, { target: { value: 'Grace' } })
    expect(screen.getByText('Pastor John Doe')).toBeInTheDocument()
  })

  it('searches by position', () => {
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    fireEvent.change(searchInput, { target: { value: 'Assistant' } })
    expect(screen.getByText('Pastor Jane Smith')).toBeInTheDocument()
  })

  it('handles pastor with phone but no email', () => {
    vi.mocked(usePastorsList).mockReturnValue({
      data: [{ id: 3, firstName: 'X', lastName: 'Y', middleName: '', email: '', phoneNumber: '999', gender: 'Male', position: 'Senior Pastor', church: { id: 1, name: 'Grace Church' }, pastorRoleId: 1 }],
      isLoading: false,
    } as any)
    render(<Pastors />)
    expect(screen.getByText('999')).toBeInTheDocument()
  })

  it('edits pastor without church', async () => {
    vi.mocked(usePastorsList).mockReturnValue({
      data: [{ id: 3, firstName: 'NoChurch', lastName: 'Pastor', middleName: '', email: 'nc@test.com', phoneNumber: '123', gender: 'Male', position: 'Senior Pastor', church: null, pastorRoleId: null }],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    await user.click(editBtn)
    expect(screen.getByText('Edit Pastor')).toBeInTheDocument()
  })

  it('paginates across many pages with ellipsis', () => {
    const manyPastors = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1, firstName: `P${i + 1}`, lastName: `L${i + 1}`, middleName: '', email: '', phoneNumber: '',
      gender: 'Male', position: 'Senior Pastor', church: { id: 1, name: 'Grace Church' }, pastorRoleId: 1,
    }))
    vi.mocked(usePastorsList).mockReturnValue({ data: manyPastors, isLoading: false } as any)
    render(<Pastors />)
    expect(screen.getByText('50 records')).toBeInTheDocument()
    const ellipsis = document.querySelector('.pagination-ellipsis')
    expect(ellipsis).toBeInTheDocument()
  })

  it('navigates through pagination pages', async () => {
    const manyPastors = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1, firstName: `P${i + 1}`, lastName: `L${i + 1}`, middleName: '', email: '', phoneNumber: '',
      gender: 'Male', position: 'Senior Pastor', church: { id: 1, name: 'Grace Church' }, pastorRoleId: 1,
    }))
    vi.mocked(usePastorsList).mockReturnValue({ data: manyPastors, isLoading: false } as any)
    render(<Pastors />)
    const nextBtn = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '›'
    ) as HTMLButtonElement
    if (nextBtn && !nextBtn.disabled) {
      fireEvent.click(nextBtn)
    }
    const prevBtn = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '‹'
    ) as HTMLButtonElement
    if (prevBtn && !prevBtn.disabled) {
      fireEvent.click(prevBtn)
    }
    const firstBtn = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '«'
    ) as HTMLButtonElement
    if (firstBtn && !firstBtn.disabled) {
      fireEvent.click(firstBtn)
    }
    const lastBtn = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '»'
    ) as HTMLButtonElement
    if (lastBtn && !lastBtn.disabled) {
      fireEvent.click(lastBtn)
    }
    const secondPage = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '2'
    ) as HTMLButtonElement
    if (secondPage) {
      fireEvent.click(secondPage)
    }
    const firstBtnNow = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '«'
    ) as HTMLButtonElement
    if (firstBtnNow && !firstBtnNow.disabled) {
      fireEvent.click(firstBtnNow)
    }
    const pageButtons = Array.from(document.querySelectorAll('.pagination .btn-outline')).filter(
      (b) => /^\d+$/.test(b.textContent || '')
    )
    for (const pb of pageButtons) {
      if (!pb.classList.contains('btn-primary')) {
        fireEvent.click(pb)
      }
    }
  })

  it('paginates member dropdown forward and back', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 3 },
    } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    const nextBtn = document.querySelector('.searchable-select-dropdown .btn-outline:last-of-type') as HTMLButtonElement
    if (nextBtn) await user.click(nextBtn)
    const prevBtn = document.querySelector('.searchable-select-dropdown .btn-outline:first-of-type') as HTMLButtonElement
    if (prevBtn) await user.click(prevBtn)
  })

  it('selects role from dropdown', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[0], '')
    await user.selectOptions(selects[0], '1')
  })

  it('selects church from dropdown', async () => {
    vi.mocked(useAllChurches).mockReturnValue({
      data: { content: [{ id: 1, name: 'Grace Church' }, { id: 2, name: 'Hope Church' }] },
    } as any)
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[1], 'Grace Church')
    await user.selectOptions(selects[1], '')
    await user.selectOptions(selects[1], 'Grace Church')
  })

  it('shows pastor with middleName in search', () => {
    vi.mocked(usePastorsList).mockReturnValue({
      data: [
        { id: 1, firstName: 'A', lastName: 'B', middleName: 'Middle', email: '', phoneNumber: '', gender: 'Male', position: 'Senior Pastor', church: null, pastorRoleId: 1 },
      ],
      isLoading: false,
    } as any)
    render(<Pastors />)
    const searchInput = screen.getByPlaceholderText('Search pastors…')
    fireEvent.change(searchInput, { target: { value: 'Middle' } })
    expect(screen.getByText('A B')).toBeInTheDocument()
  })

  it('clicking outside closes member dropdown', async () => {
    const user = userEvent.setup()
    render(<Pastors />)
    await user.click(screen.getByText('Add Pastor'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('John Member')).not.toBeInTheDocument()
  })
})
