import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'

vi.setConfig({ testTimeout: 15000 })

afterEach(() => {
  vi.useRealTimers()
})

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

const mockUpdateMut = vi.fn().mockResolvedValue(undefined)
const mockDeleteMut = vi.fn().mockResolvedValue(undefined)

vi.mock('../hooks/useChurches', () => ({
  useAllChurches: vi.fn(() => ({
    data: { content: [{ id: 1, name: 'Grace Church' }, { id: 2, name: 'Hope Church' }] },
  })),
}))

vi.mock('../hooks/usePeople', () => ({
  usePastor: vi.fn(),
  useUpdatePastor: vi.fn(),
  useDeletePastor: vi.fn(),
  usePastorRoles: vi.fn(() => ({
    data: [{ id: 1, name: 'Senior Pastor' }, { id: 2, name: 'Assistant Pastor' }],
  })),
  usePeopleList: vi.fn(() => ({
    data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 2 },
  })),
}))

import PastorDetail from './PastorDetail'
import { usePastor, useUpdatePastor, useDeletePastor, usePeopleList } from '../hooks/usePeople'
import { useAllChurches } from '../hooks/useChurches'

const defaultPastorData = {
  id: 1, firstName: 'John', lastName: 'Doe', middleName: 'M', gender: 'Male',
  email: 'pastor@test.com', phoneNumber: '1111111', position: 'Senior Pastor',
  church: { id: 1, name: 'Grace Church' }, pastorRoleId: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockNavigate.mockClear()
  mockUpdateMut.mockReset().mockResolvedValue(undefined)
  mockDeleteMut.mockReset().mockResolvedValue(undefined)
  vi.mocked(usePastor).mockReturnValue({ data: defaultPastorData, isLoading: false } as any)
  vi.mocked(useUpdatePastor).mockReturnValue({ mutateAsync: mockUpdateMut, isPending: false } as any)
  vi.mocked(useDeletePastor).mockReturnValue({ mutateAsync: mockDeleteMut, isPending: false } as any)
  vi.mocked(usePeopleList).mockReturnValue({
    data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 2 },
  } as any)
  vi.mocked(useAllChurches).mockReturnValue({
    data: { content: [{ id: 1, name: 'Grace Church' }, { id: 2, name: 'Hope Church' }] },
  } as any)
})

describe('PastorDetail', () => {
  it('renders pastor details', () => {
    render(<PastorDetail />)
    expect(screen.getByText('John M Doe')).toBeInTheDocument()
    expect(screen.getByText('Grace Church')).toBeInTheDocument()
    expect(screen.getAllByText('Senior Pastor').length).toBeGreaterThan(0)
    expect(screen.getByText('pastor@test.com')).toBeInTheDocument()
    expect(screen.getByText('1111111')).toBeInTheDocument()
    expect(screen.getByText('Male')).toBeInTheDocument()
  })

  it('renders pastor without middle name', () => {
    vi.mocked(usePastor).mockReturnValue({
      data: { ...defaultPastorData, middleName: '' },
      isLoading: false,
    } as any)
    render(<PastorDetail />)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
  })

  it('renders fallback values for missing fields', () => {
    vi.mocked(usePastor).mockReturnValue({
      data: { ...defaultPastorData, email: '', phoneNumber: '', gender: '', position: '', church: null },
      isLoading: false,
    } as any)
    render(<PastorDetail />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows loading state', () => {
    vi.mocked(usePastor).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<PastorDetail />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('shows not found when pastor is null', () => {
    vi.mocked(usePastor).mockReturnValue({ data: null, isLoading: false } as any)
    render(<PastorDetail />)
    expect(screen.getByText('Pastor not found')).toBeInTheDocument()
    expect(screen.getByText('Back to Pastors')).toBeInTheDocument()
  })

  it('navigates back from not found state', async () => {
    vi.mocked(usePastor).mockReturnValue({ data: null, isLoading: false } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Back to Pastors'))
    expect(mockNavigate).toHaveBeenCalledWith('/pastors')
  })

  it('navigates back via breadcrumb', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    const breadcrumbLinks = screen.getAllByText('Pastors')
    await user.click(breadcrumbLinks[0])
    expect(mockNavigate).toHaveBeenCalledWith('/pastors')
  })

  it('opens edit form', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Pastor')).toBeInTheDocument()
    expect(screen.getByText('Update pastor information')).toBeInTheDocument()
  })

  it('closes edit form via cancel button', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const cancelBtn = screen.getByText('Cancel')
    await user.click(cancelBtn)
    expect(screen.queryByText('Edit Pastor')).not.toBeInTheDocument()
  })

  it('closes edit form via overlay click', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.click(document.querySelector('.mf-overlay')!)
    expect(screen.queryByText('Edit Pastor')).not.toBeInTheDocument()
  })

  it('closes edit form via close button', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const closeBtn = document.querySelector('.mf-close')!
    await user.click(closeBtn)
    expect(screen.queryByText('Edit Pastor')).not.toBeInTheDocument()
  })

  it('populates edit form with pastor data', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
  })

  it('submits edit form successfully', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    expect(mockUpdateMut).toHaveBeenCalled()
  })

  it('handles edit form submission error', async () => {
    mockUpdateMut.mockRejectedValueOnce(new Error('Update failed'))
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Update failed'))
  })

  it('handles edit form submission with non-Error exception', async () => {
    mockUpdateMut.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update'))
  })

  it('opens delete confirm dialog', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Delete'))
    expect(screen.getByText('Delete this pastor?')).toBeInTheDocument()
  })

  it('confirms delete and navigates', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Delete'))
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    expect(mockDeleteMut).toHaveBeenCalled()
  })

  it('handles delete error', async () => {
    mockDeleteMut.mockRejectedValueOnce(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Delete'))
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    expect(toast.error).toHaveBeenCalledWith('Delete failed')
  })

  it('handles delete with non-Error exception', async () => {
    mockDeleteMut.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Delete'))
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    expect(toast.error).toHaveBeenCalledWith('Failed to delete')
  })

  it('cancels delete', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Delete'))
    const cancelBtn = screen.getByText('common.cancel')
    await user.click(cancelBtn)
    expect(mockDeleteMut).not.toHaveBeenCalled()
  })

  it('shows member dropdown with options on focus', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('John Member')).toBeInTheDocument()
  })

  it('selects a member from dropdown', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    await user.click(screen.getByText('John Member'))
    expect(searchInput).toHaveValue('John Member')
  })

  it('paginates member dropdown', async () => {
    const { usePeopleList } = await import('../hooks/usePeople')
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 3 },
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('shows empty member dropdown', async () => {
    const { usePeopleList } = await import('../hooks/usePeople')
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [], totalPages: 0 },
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('No matching members')).toBeInTheDocument()
  })

  it('handles pastor without church', () => {
    vi.mocked(usePastor).mockReturnValue({
      data: { ...defaultPastorData, church: null },
      isLoading: false,
    } as any)
    render(<PastorDetail />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows pending state during update', async () => {
    vi.mocked(useUpdatePastor).mockReturnValue({ mutateAsync: mockUpdateMut, isPending: true } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('types in member search', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.clear(searchInput)
    await user.type(searchInput, 'test')
    expect(searchInput).toHaveValue('test')
  })

  it('clicks next pagination button in member dropdown', async () => {
    const { usePeopleList } = await import('../hooks/usePeople')
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 3 },
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    const nextBtn = screen.getByText('›')
    await user.click(nextBtn)
    expect(await screen.findByText('2 / 3', {}, { timeout: 5000 })).toBeInTheDocument()
  })

  it('clicks prev pagination button in member dropdown', async () => {
    const { usePeopleList } = await import('../hooks/usePeople')
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ id: 10, firstName: 'John', lastName: 'Member', email: 'jm@test.com' }], totalPages: 3 },
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    const nextBtn = screen.getByText('›')
    await user.click(nextBtn)
    expect(await screen.findByText('2 / 3', {}, { timeout: 5000 })).toBeInTheDocument()
    const prevBtn = screen.getByText('‹')
    await user.click(prevBtn)
    expect(await screen.findByText('1 / 3', {}, { timeout: 5000 })).toBeInTheDocument()
  })

  it('validates memberId is required on submit', async () => {
    vi.mocked(usePastor).mockReturnValue({
      data: { ...defaultPastorData, id: 0 },
      isLoading: false,
    } as any)
    const { usePeopleList } = await import('../hooks/usePeople')
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [], totalPages: 0 },
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.clear(searchInput)
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please select a member'))
  })

  it('validates pastorRoleId is required on submit', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '')
    await user.selectOptions(selects[1], '1')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Pastor role is required'))
  })

  it('validates churchId is required on submit', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], '1')
    await user.selectOptions(selects[1], '')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Church is required'))
  })

  it('closes member dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('John Member')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    await waitFor(() => expect(screen.queryByText('John Member')).not.toBeInTheDocument())
  })

  it('debounces member search', async () => {
    const user = userEvent.setup()
    const { usePeopleList } = await import('../hooks/usePeople')
    const mockFn = vi.mocked(usePeopleList)
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    mockFn.mockClear()
    fireEvent.change(searchInput, { target: { value: 'ab' } })
    expect(searchInput).toHaveValue('ab')
    expect(mockFn.mock.calls[mockFn.mock.calls.length - 1][0]?.search).toBeUndefined()
    await waitFor(() => {
      expect(mockFn.mock.calls[mockFn.mock.calls.length - 1][0]?.search).toBe('ab')
    })
  })

  it('handles undefined churchPage data', async () => {
    vi.mocked(useAllChurches).mockReturnValue({ data: undefined } as any)
    render(<PastorDetail />)
    expect(screen.getByText('John M Doe')).toBeInTheDocument()
  })

  it('handles undefined memberPageData', async () => {
    vi.mocked(usePeopleList).mockReturnValue({ data: undefined } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.queryByText('John Member')).not.toBeInTheDocument()
  })

  it('opens edit form with null pastorRoleId', async () => {
    vi.mocked(usePastor).mockReturnValue({
      data: { ...defaultPastorData, pastorRoleId: null },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Pastor')).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('')
  })

  it('opens edit form with null church', async () => {
    vi.mocked(usePastor).mockReturnValue({
      data: { ...defaultPastorData, church: null },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Pastor')).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    expect(selects[1]).toHaveValue('')
  })

  it('shows member with empty email in dropdown', async () => {
    vi.mocked(usePeopleList).mockReturnValue({
      data: { content: [{ id: 20, firstName: 'Jane', lastName: 'Doe', email: '' }], totalPages: 1 },
    } as any)
    const user = userEvent.setup()
    render(<PastorDetail />)
    await user.click(screen.getByText('Edit'))
    const searchInput = screen.getByPlaceholderText('Search members...')
    await user.click(searchInput)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })
})
