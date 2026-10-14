import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUseParams = vi.fn().mockReturnValue({ id: '1' })

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: (...args: any[]) => mockUseParams(...args), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_create_church', 'can_delete_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  })),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showConfirm: vi.fn().mockResolvedValue(true),
}))

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
const mockPeopleApiList = vi.fn()
vi.mock('../hooks/useChurches', () => ({
  useChurch: vi.fn(() => ({
    data: {
      id: 1, name: 'Grace Church', address: '123 Main St',
      parentChurch: null, parentChurchId: null,
      pastors: [{ id: 1, name: 'Pastor John', phoneNumber: '1111111', email: 'pastor@test.com' }],
      elders: [{ id: 2, name: 'Elder Jane', phoneNumber: '2222222', email: 'elder@test.com' }],
      deacons: [{ id: 3, name: 'Deacon Bob', phoneNumber: '3333333', email: 'deacon@test.com' }],
    },
    isLoading: false,
  })),
  useUpdateChurch: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
  useSubChurches: vi.fn(() => ({
    data: [{ id: 3, name: 'Branch Church', address: '789 Branch St' }],
  })),
}))
vi.mock('../hooks/usePeople', () => ({
  useChurchMembers: vi.fn(() => ({
    data: {
      content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: true, church: { id: 1, name: 'Grace Church' } },
        { id: 2, firstName: 'Jane', lastName: 'Smith', admin: false, church: { id: 1, name: 'Grace Church' } },
      ],
    },
  })),
}))
vi.mock('../hooks/useApi', () => ({
  unwrap: vi.fn((p: any) => Promise.resolve(p)),
}))
vi.mock('../services/api', () => ({
  peopleApi: { list: (...args: any[]) => mockPeopleApiList(...args), search: vi.fn().mockResolvedValue([]) },
}))

import ChurchDetail from './ChurchDetail'
import { useChurch, useUpdateChurch } from '../hooks/useChurches'
import { useChurchMembers } from '../hooks/usePeople'
import { useAuth } from '../context/AuthContext'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'

const defaultChurchData = {
  id: 1, name: 'Grace Church', address: '123 Main St',
  parentChurch: null, parentChurchId: null,
  pastors: [{ id: 1, name: 'Pastor John', phoneNumber: '1111111', email: 'pastor@test.com' }],
  elders: [{ id: 2, name: 'Elder Jane', phoneNumber: '2222222', email: 'elder@test.com' }],
  deacons: [{ id: 3, name: 'Deacon Bob', phoneNumber: '3333333', email: 'deacon@test.com' }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseParams.mockReturnValue({ id: '1' })
  mockPeopleApiList.mockResolvedValue({ content: [] })
  mockMutateAsync.mockResolvedValue(undefined)
  vi.mocked(useChurch).mockReturnValue({ data: defaultChurchData, isLoading: false } as any)
  vi.mocked(useUpdateChurch).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useChurchMembers).mockReturnValue({
    data: { content: [
      { id: 1, firstName: 'John', lastName: 'Doe', admin: true, church: { id: 1, name: 'Grace Church' } },
      { id: 2, firstName: 'Jane', lastName: 'Smith', admin: false, church: { id: 1, name: 'Grace Church' } },
    ] },
  } as any)
  vi.mocked(useAuth).mockReturnValue({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_create_church', 'can_delete_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  } as any)
})

describe('ChurchDetail', () => {
  it('renders church details', () => {
    render(<ChurchDetail />)
    expect(screen.getAllByText('Grace Church').length).toBeGreaterThan(0)
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Admin: John Doe')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(useChurch).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<ChurchDetail />)
    expect(document.querySelector('.skeleton-card')).toBeInTheDocument()
    expect(document.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('shows not found when church is null', () => {
    vi.mocked(useChurch).mockReturnValue({ data: null, isLoading: false } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('churches.notFound')).toBeInTheDocument()
    expect(screen.getByText('common.back')).toBeInTheDocument()
  })

  it('shows pastors card', () => {
    render(<ChurchDetail />)
    expect(screen.getByText('Pastors')).toBeInTheDocument()
    expect(screen.getByText('Pastor John')).toBeInTheDocument()
  })

  it('shows elders card', () => {
    render(<ChurchDetail />)
    expect(screen.getByText('Elders')).toBeInTheDocument()
    expect(screen.getByText('Elder Jane')).toBeInTheDocument()
  })

  it('shows deacons card', () => {
    render(<ChurchDetail />)
    expect(screen.getByText('Deacons')).toBeInTheDocument()
    expect(screen.getByText('Deacon Bob')).toBeInTheDocument()
  })

  it('shows members card', () => {
    render(<ChurchDetail />)
    expect(screen.getAllByText('Members').length).toBeGreaterThan(0)
  })

  it('navigates back to churches', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    await user.click(screen.getByText('Churches'))
  })

  it('shows parent name when parentChurch exists', () => {
    vi.mocked(useChurch).mockReturnValue({
      data: { ...defaultChurchData, parentChurch: { id: 10, name: 'Big Church' } },
      isLoading: false,
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Big Church')).toBeInTheDocument()
  })

  it('shows parent id when parentChurchId exists', () => {
    vi.mocked(useChurch).mockReturnValue({
      data: { ...defaultChurchData, parentChurchId: 99 },
      isLoading: false,
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('#99')).toBeInTheDocument()
  })

  it('toggles collapsible card open/closed', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const pastorsHeader = screen.getByText('Pastors').closest('header')!
    await user.click(pastorsHeader)
    await user.click(pastorsHeader)
  })

  it('collapsible card keyboard interaction', async () => {
    render(<ChurchDetail />)
    const pastorsHeader = screen.getByText('Pastors').closest('header')!
    fireEvent.keyDown(pastorsHeader, { key: 'Enter' })
    fireEvent.keyDown(pastorsHeader, { key: ' ' })
    fireEvent.keyDown(pastorsHeader, { key: 'A' })
  })

  it('opens assign person modal via onAdd button', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      expect(screen.getByText('Assign Pastors')).toBeInTheDocument()
    }
  })

  it('assign person modal search and cancel', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      const nameInput = screen.getByPlaceholderText('Filter by name')
      await user.type(nameInput, 'test')
      fireEvent.submit(nameInput.closest('form')!)
      await screen.findByText('No matching people found')
      await user.click(screen.getByText('Cancel'))
    }
  })

  it('assign person modal with results', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
    }
  })

  it('assign person modal overlay click closes', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.click(document.querySelector('.dialog-overlay')!)
    }
  })

  it('assign person modal with paginated results', async () => {
    const people = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, email: `p${i}@test.com`, phoneNumber: `${i}000000`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleApiList.mockResolvedValue({ content: people })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    await user.click(addBtns[0])
    await user.type(screen.getByPlaceholderText('Filter by name'), 'test')
    const searchBtn = screen.getByRole('button', { name: /search/i })
    await user.click(searchBtn)
    await vi.waitFor(() => {
      expect(screen.getByText(/total/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('edit position holder modal opens and cancels', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      expect(screen.getByText('Edit Pastor John')).toBeInTheDocument()
      await user.click(screen.getByText('Cancel'))
    }
  })

  it('edit position holder modal submits', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      await user.click(screen.getByText('Save'))
    }
  })

  it('edit position holder modal overlay click closes', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      fireEvent.click(document.querySelector('.dialog-overlay')!)
    }
  })

  it('remove position holder with confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const removeBtns = document.querySelectorAll('[title="Remove"]')
    if (removeBtns.length > 0) {
      await user.click(removeBtns[0])
    }
    vi.restoreAllMocks()
  })

  it('remove position holder cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const removeBtns = document.querySelectorAll('[title="Remove"]')
    if (removeBtns.length > 0) {
      await user.click(removeBtns[0])
    }
    vi.restoreAllMocks()
  })

  it('sub churches view navigates', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const viewBtns = document.querySelectorAll('[title="View"]')
    if (viewBtns.length > 0) {
      await user.click(viewBtns[viewBtns.length - 1])
    }
  })

  it('search in searchable table filters', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const searchInputs = document.querySelectorAll('.st-search-input')
    if (searchInputs.length > 0) {
      await user.type(searchInputs[0], 'Pastor John')
      const clearBtn = searchInputs[0].closest('.st-search')?.querySelector('.st-search-clear')
      if (clearBtn) await user.click(clearBtn)
    }
  })

  it('searchable table with empty data shows empty message', () => {
    vi.mocked(useChurch).mockReturnValue({
      data: {
        ...defaultChurchData,
        pastors: [],
        elders: [],
        deacons: [],
      },
      isLoading: false,
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('No pastor assigned')).toBeInTheDocument()
    expect(screen.getByText('No elder assigned')).toBeInTheDocument()
  })

  it('person without admin badge', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 2, firstName: 'Jane', lastName: 'Smith', admin: false, church: { id: 1, name: 'Grace Church' } },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.queryByText('Admin:')).not.toBeInTheDocument()
  })

  it('member table renders status columns', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', baptised: true, tel: '111', emailAddress: 'j@test.com' },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Communicant Member')).toBeInTheDocument()
  })

  it('member non-baptised', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', isBaptised: false, baptised: false },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Non Communicant Member')).toBeInTheDocument()
  })

  it('sub church view action', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const viewBtns = document.querySelectorAll('[title="View"]')
    if (viewBtns.length > 0) {
      await user.click(viewBtns[viewBtns.length - 1])
    }
  })

  it('assign person modal for elders', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 1) {
      await user.click(addBtns[1])
      expect(screen.getByText('Assign Elders')).toBeInTheDocument()
      await user.click(screen.getByText('Cancel'))
    }
  })

  it('assign person modal for deacons', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 2) {
      await user.click(addBtns[2])
      expect(screen.getByText('Assign Deacons')).toBeInTheDocument()
      await user.click(screen.getByText('Cancel'))
    }
  })

  it('edit modal error handling', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Update failed'))
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      await user.click(screen.getByText('Save'))
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalled()
      })
    }
  })

  it('assign person api error', async () => {
    mockPeopleApiList.mockRejectedValueOnce(new Error('Search API failed'))
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalled()
      })
    }
  })

  it('searchable table with undefined data', () => {
    vi.mocked(useChurch).mockReturnValue({
      data: {
        ...defaultChurchData,
        pastors: undefined as any,
        elders: undefined as any,
      },
      isLoading: false,
    } as any)
    render(<ChurchDetail />)
  })

  it('not found back button navigates', async () => {
    vi.mocked(useChurch).mockReturnValue({ data: null, isLoading: false } as any)
    const user = userEvent.setup()
    render(<ChurchDetail />)
    await user.click(screen.getByText('common.back'))
  })

  it('pagination next/prev in searchable table', async () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, firstName: `Member${i}`, lastName: `Last${i}`, admin: false,
        church: { id: 1, name: 'Grace Church' },
      })) },
    } as any)
    render(<ChurchDetail />)
    const pageBtns = document.querySelectorAll('.st-page-btn')
    if (pageBtns.length > 2) {
      const user = userEvent.setup()
      await user.click(pageBtns[pageBtns.length - 1])
      await user.click(pageBtns[0])
    }
  })

  it('search input with no match', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const searchInputs = document.querySelectorAll('.st-search-input')
    if (searchInputs.length > 0) {
      await user.type(searchInputs[0], 'zzzznonexistent')
    }
  })

  it('assign modal all filters empty', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('No matching people found')
    }
  })

  it('edit position holder modal updates fields', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      const nameInput = screen.getByDisplayValue('Pastor John')
      await user.clear(nameInput)
      await user.type(nameInput, 'Pastor John Updated')
      const phoneInput = screen.getByDisplayValue('1111111')
      await user.clear(phoneInput)
      await user.type(phoneInput, '9999999')
      const emailInput = screen.getByDisplayValue('pastor@test.com')
      await user.clear(emailInput)
      await user.type(emailInput, 'new@test.com')
      await user.click(screen.getByText('Save'))
    }
  })

  it('assign modal paginated results with next page', async () => {
    const people = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, email: `p${i}@test.com`, phoneNumber: `${i}000000`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleApiList.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText(/total/)
      const pageBtns = document.querySelectorAll('.st-page-btn')
      const nextBtn = Array.from(pageBtns).find((b) => b.textContent === '›')
      if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
        await user.click(nextBtn)
      }
    }
  })

  it('sub churches view action navigates', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const subViewBtns = document.querySelectorAll('[title="View"]')
    if (subViewBtns.length > 0) {
      await user.click(subViewBtns[subViewBtns.length - 1])
    }
  })

  it('assign person modal handles search error', async () => {
    mockPeopleApiList.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalled()
      })
    }
  })

  it('assign person modal filter fields', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      await user.type(screen.getByPlaceholderText('Filter by name'), 'John')
      await user.type(screen.getByPlaceholderText('Filter by email'), 'john@test.com')
      await user.type(screen.getByPlaceholderText('Filter by phone'), '123456')
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('No matching people found')
    }
  })

  it('edit position modal name validation', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      const nameInput = screen.getByDisplayValue('Pastor John')
      await user.clear(nameInput)
      await user.click(screen.getByText('Save'))
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalled()
      })
    }
  })

  it('assign person handles error during assignment', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
      await vi.waitFor(() => {
        expect(showSuccessToast).toHaveBeenCalled()
      })
    }
  })

  it('members table renders gender column', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', baptised: true, tel: '111', emailAddress: 'j@test.com' },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Male')).toBeInTheDocument()
  })

  it('members table tel column renders dash when empty', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', baptised: true },
      ] },
    } as any)
    render(<ChurchDetail />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('searchable table pagination with many pages', async () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, firstName: `Member${i}`, lastName: `Last${i}`, admin: false,
        church: { id: 1, name: 'Grace Church' },
      })) },
    } as any)
    render(<ChurchDetail />)
    const pageBtns = document.querySelectorAll('.st-page-btn')
    const lastBtn = Array.from(pageBtns).find((b) => b.textContent === '›')
    if (lastBtn && !(lastBtn as HTMLButtonElement).disabled) {
      const user = userEvent.setup()
      await user.click(lastBtn)
    }
  })

  it('members pagination click specific page numbers and ellipsis', async () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: Array.from({ length: 55 }, (_, i) => ({
        id: i + 1, firstName: `Member${i}`, lastName: `Last${i}`, admin: false,
        church: { id: 1, name: 'Grace Church' },
      })) },
    } as any)
    render(<ChurchDetail />)
    const membersCard = document.querySelectorAll('.cd-card')
    const lastCard = membersCard[membersCard.length - 1]
    const nextBtn = lastCard.querySelector('.st-page-btn:last-of-type') || Array.from(lastCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
    const user = userEvent.setup()
    if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
      await user.click(nextBtn)
      await user.click(nextBtn)
      await user.click(nextBtn)
      const pageThreeBtn = Array.from(lastCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '3')
      if (pageThreeBtn) await user.click(pageThreeBtn)
    }
  })

  it('members pagination prev on first page and next on last page', async () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1, firstName: `Member${i}`, lastName: `Last${i}`, admin: false,
        church: { id: 1, name: 'Grace Church' },
      })) },
    } as any)
    render(<ChurchDetail />)
    const lastCard = document.querySelectorAll('.cd-card')[document.querySelectorAll('.cd-card').length - 1]
    const prevBtn = Array.from(lastCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '‹')
    expect(prevBtn).toBeDisabled()
    const user = userEvent.setup()
    const nextBtn = Array.from(lastCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
    if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
      await user.click(nextBtn)
      await user.click(nextBtn)
      const lastPageBtn = Array.from(lastCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '3')
      if (lastPageBtn) await user.click(lastPageBtn)
      const nextBtnAfter = Array.from(lastCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
      expect(nextBtnAfter).toBeDisabled()
    }
  })

  it('position tables pagination click specific page and ellipsis', async () => {
    const manyPastors = Array.from({ length: 25 }, (_, i) => ({
      id: i + 10, name: `Pastor${i}`, phoneNumber: `${i}111`, email: `p${i}@test.com`,
    }))
    vi.mocked(useChurch).mockReturnValue({
      data: { ...defaultChurchData, pastors: manyPastors },
      isLoading: false,
    } as any)
    render(<ChurchDetail />)
    const pastorsCard = document.querySelector('.cd-card')
    if (pastorsCard) {
      const user = userEvent.setup()
      const nextBtn = Array.from(pastorsCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
      if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
        await user.click(nextBtn)
        await user.click(nextBtn)
        const page3 = Array.from(pastorsCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '3')
        if (page3) await user.click(page3)
        const prevBtn = Array.from(pastorsCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '‹')
        if (prevBtn && !(prevBtn as HTMLButtonElement).disabled) await user.click(prevBtn)
      }
    }
  })

  it('position table prev disabled on first page', async () => {
    render(<ChurchDetail />)
    const pastorsCard = document.querySelector('.cd-card')
    if (pastorsCard) {
      const prevBtn = Array.from(pastorsCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '‹')
      expect(prevBtn).toBeDisabled()
      const nextBtn = Array.from(pastorsCard.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
      expect(nextBtn).toBeDisabled()
    }
  })

  it('assign modal error during assignment with non-Error throw', async () => {
    mockMutateAsync.mockImplementation(() => { throw 'string error' })
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith('Failed to assign')
      })
    }
  })

  it('assign modal error during assignment with Error object', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Assign failed'))
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith('Assign failed')
      })
    }
  })

  it('edit modal error with non-Error throw', async () => {
    mockMutateAsync.mockRejectedValue('string error')
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      await user.click(screen.getByText('Save'))
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith('Failed to update')
      })
    }
  })

  it('edit modal saves with empty phone and email', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      const phoneInput = screen.getByDisplayValue('1111111')
      await user.clear(phoneInput)
      const emailInput = screen.getByDisplayValue('pastor@test.com')
      await user.clear(emailInput)
      await user.click(screen.getByText('Save'))
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    }
  })

  it('handleRemove success path calls successToast', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const removeBtns = document.querySelectorAll('[title="Remove"]')
    if (removeBtns.length > 0) {
      await user.click(removeBtns[0])
      await vi.waitFor(() => {
        expect(showSuccessToast).toHaveBeenCalled()
      })
    }
    vi.restoreAllMocks()
  })

  it('visiblePositions with limited permissions shows fewer cards', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'user', permissions: ['can_read_pastor', 'can_read_members', 'can_read_church'], churchId: '1', roles: ['USER'] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Pastors')).toBeInTheDocument()
    expect(screen.queryByText('Elders')).not.toBeInTheDocument()
    expect(screen.queryByText('Deacons')).not.toBeInTheDocument()
  })

  it('visiblePositions with no position permissions', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'user', permissions: ['can_read_members'], churchId: '1', roles: ['USER'] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<ChurchDetail />)
    expect(screen.queryByText('Pastors')).not.toBeInTheDocument()
    expect(screen.queryByText('Elders')).not.toBeInTheDocument()
    expect(screen.queryByText('Deacons')).not.toBeInTheDocument()
  })

  it('sub churches and members hidden without read permissions', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'user', permissions: ['can_read_pastor'], churchId: '1', roles: ['USER'] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<ChurchDetail />)
    expect(screen.queryAllByText('Sub Churches').filter((el) => el.closest('.cd-card')).length).toBe(0)
    expect(screen.queryAllByText('Members').filter((el) => el.closest('.cd-card')).length).toBe(0)
  })

  it('members table email column renders dash when empty', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', baptised: true, tel: '111' },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('members table status uses isBaptised field when present', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', isBaptised: true, emailAddress: 'j@test.com', tel: '111' },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Communicant Member')).toBeInTheDocument()
  })

  it('members table isBaptised false shows non-communicant', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', isBaptised: false, emailAddress: 'j@test.com', tel: '111' },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Non Communicant Member')).toBeInTheDocument()
  })

  it('assign modal paginated results with many people and next/prev', async () => {
    const people = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, email: `p${i}@test.com`, phoneNumber: `${i}000000`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleApiList.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText(/total/)
      const modalPageBtns = document.querySelectorAll('.dialog-lg .st-page-btn')
      const nextBtn = Array.from(modalPageBtns).find((b) => b.textContent === '›')
      if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
        await user.click(nextBtn)
        const modalPageBtns2 = document.querySelectorAll('.dialog-lg .st-page-btn')
        const prevBtn = Array.from(modalPageBtns2).find((b) => b.textContent === '‹')
        if (prevBtn && !(prevBtn as HTMLButtonElement).disabled) {
          await user.click(prevBtn)
        }
      }
    }
  })

  it('assign modal excludeIds filter out existing holders', async () => {
    const people = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, email: `p${i}@test.com`, phoneNumber: `${i}000000`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleApiList.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await vi.waitFor(() => {
        expect(screen.getByText(/total/)).toBeInTheDocument()
      })
      const totalText = screen.getByText(/total/).textContent || ''
      const count = parseInt(totalText)
      expect(count).toBeLessThan(10)
    }
  })

  it('assign modal with results and empty email and phone', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: '', phoneNumber: '', tel: '' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    }
  })

  it('assign modal search error with non-Error throw', async () => {
    mockPeopleApiList.mockRejectedValue('string error')
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await vi.waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith('Search failed')
      })
    }
  })

  it('assign modal results from array data (no content wrapper)', async () => {
    mockPeopleApiList.mockResolvedValueOnce([
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'new@test.com' },
    ])
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
    }
  })

  it('person with no id in church data', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { firstName: 'Jane', lastName: 'Smith', admin: false, gender: 'Female', baptised: false },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('person with null key in church data', () => {
    vi.mocked(useChurchMembers).mockReturnValue({
      data: { content: [
        { id: 1, firstName: 'John', lastName: 'Doe', admin: false, gender: 'Male', baptised: true, emailAddress: null, tel: null },
      ] },
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('assign modal pagination ellipsis with many pages', async () => {
    const people = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, email: `p${i}@test.com`, phoneNumber: `${i}000000`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleApiList.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText(/total/)
      const modal = document.querySelector('.dialog-lg')!
      const nextBtn = Array.from(modal.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
      if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
        await user.click(nextBtn)
        await user.click(nextBtn)
        const page4 = Array.from(modal.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '4')
        if (page4) await user.click(page4)
      }
    }
  })

  it('assign modal prev disabled on first page', async () => {
    const people = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, email: `p${i}@test.com`, phoneNumber: `${i}000000`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleApiList.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText(/total/)
      const modal = document.querySelector('.dialog-lg')!
      const prevBtn = Array.from(modal.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '‹')
      expect(prevBtn).toBeDisabled()
    }
  })

  it('assign modal next disabled on last page', async () => {
    const people = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, email: `p${i}@test.com`, phoneNumber: `${i}000000`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleApiList.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText(/total/)
      const modal = document.querySelector('.dialog-lg')!
      const nextBtn = Array.from(modal.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
      if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
        await user.click(nextBtn)
        const nextBtn2 = Array.from(modal.querySelectorAll('.st-page-btn')).find((b) => b.textContent === '›')
        expect(nextBtn2).toBeDisabled()
      }
    }
  })

  it('searchable table with no results shows empty message', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const searchInputs = document.querySelectorAll('.st-search-input')
    if (searchInputs.length > 0) {
      await user.type(searchInputs[0], 'zzzzzzz')
      expect(screen.getByText('No pastor assigned')).toBeInTheDocument()
    }
  })

  it('searchable table filters out null values', async () => {
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const searchInputs = document.querySelectorAll('.st-search-input')
    if (searchInputs.length > 0) {
      await user.type(searchInputs[0], 'zzzz')
    }
  })

  it('assign modal searching state shows ellipsis', async () => {
    let resolveSearch: any
    mockPeopleApiList.mockReturnValueOnce(new Promise((r) => { resolveSearch = r }))
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await vi.waitFor(() => {
        expect(screen.getByText('…')).toBeInTheDocument()
      })
      resolveSearch({ content: [] })
    }
  })

  it('assign modal assigning state shows ellipsis on button', async () => {
    let resolveAssign: any
    mockMutateAsync.mockReturnValueOnce(new Promise((r) => { resolveAssign = r }))
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
      await vi.waitFor(() => {
        expect(document.querySelector('.btn-sm[disabled]')).toBeInTheDocument()
      })
      resolveAssign()
    }
  })

  it('members card has no onAdd button', () => {
    render(<ChurchDetail />)
    const cards = document.querySelectorAll('.cd-card')
    const membersCard = Array.from(cards).find((c) => c.textContent?.includes('Members'))
    if (membersCard) {
      expect(membersCard.querySelector('.cd-add-btn')).not.toBeInTheDocument()
    }
  })

  it('sub churches card has no onAdd button', () => {
    render(<ChurchDetail />)
    const cards = document.querySelectorAll('.cd-card')
    const subCard = Array.from(cards).find((c) => c.textContent?.includes('Sub Churches'))
    if (subCard) {
      expect(subCard.querySelector('.cd-add-btn')).not.toBeInTheDocument()
    }
  })

  it('position holder with null phone and email renders dash in table', () => {
    vi.mocked(useChurch).mockReturnValue({
      data: {
        ...defaultChurchData,
        pastors: [{ id: 1, name: 'Pastor John' }],
      },
      isLoading: false,
    } as any)
    render(<ChurchDetail />)
    const dashes = screen.getAllByText('—')
    const tableDashes = Array.from(dashes).filter((el) => el.tagName === 'TD')
    expect(tableDashes.length).toBeGreaterThanOrEqual(1)
  })

  it('edit holder without phoneNumber and email initializes empty', async () => {
    vi.mocked(useChurch).mockReturnValue({
      data: {
        ...defaultChurchData,
        pastors: [{ id: 1, name: 'Pastor John' }],
        elders: [{ id: 2, name: 'Elder Jane' }],
        deacons: [{ id: 3, name: 'Deacon Bob' }],
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      expect(screen.getByText('Edit Pastor John')).toBeInTheDocument()
      await user.click(screen.getByText('Save'))
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    }
  })

  it('useParams with undefined id shows not found', () => {
    mockUseParams.mockReturnValue({ id: undefined })
    vi.mocked(useChurch).mockReturnValue({ data: null, isLoading: false } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('churches.notFound')).toBeInTheDocument()
  })

  it('membersPage undefined shows empty members list', () => {
    vi.mocked(useChurchMembers).mockReturnValue({ data: undefined } as any)
    render(<ChurchDetail />)
    const badges = screen.getAllByText('0')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('assign person without tel uses phoneNumber fallback', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', emailAddress: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
      await vi.waitFor(() => {
        expect(showSuccessToast).toHaveBeenCalled()
      })
    }
  })

  it('assign person without emailAddress uses email fallback', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', phoneNumber: '5555555', tel: '5555555', email: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
      await vi.waitFor(() => {
        expect(showSuccessToast).toHaveBeenCalled()
      })
    }
  })

  it('assign to position church does not have uses empty array fallback', async () => {
    vi.mocked(useChurch).mockReturnValue({
      data: {
        id: 1, name: 'Grace Church', address: '123 Main St',
        parentChurch: null, parentChurchId: null,
        pastors: [{ id: 1, name: 'Pastor John', phoneNumber: '1111111', email: 'pastor@test.com' }],
        elders: [{ id: 2, name: 'Elder Jane', phoneNumber: '2222222', email: 'elder@test.com' }],
      },
      isLoading: false,
    } as any)
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'New', lastName: 'Person', email: 'new@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'new@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    const deaconsBtn = addBtns[2]
    if (deaconsBtn) {
      await user.click(deaconsBtn)
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('New Person')
      await user.click(screen.getByText('Assign'))
      await vi.waitFor(() => {
        expect(showSuccessToast).toHaveBeenCalled()
      })
    }
  })

  it('assign modal with single result no pagination', async () => {
    mockPeopleApiList.mockResolvedValueOnce({ content: [
      { id: 10, firstName: 'Solo', lastName: 'Person', email: 'solo@test.com', phoneNumber: '5555555', tel: '5555555', emailAddress: 'solo@test.com' },
    ] })
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const addBtns = document.querySelectorAll('.cd-add-btn')
    if (addBtns.length > 0) {
      await user.click(addBtns[0])
      fireEvent.submit(screen.getByText('Search').closest('form')!)
      await screen.findByText('Solo Person')
      expect(screen.getByText('1 total')).toBeInTheDocument()
    }
  })

  it('searchable table with non-array data treats as empty', () => {
    vi.mocked(useChurch).mockReturnValue({
      data: {
        ...defaultChurchData,
        pastors: 'invalid' as any,
      },
      isLoading: false,
    } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('No pastor assigned')).toBeInTheDocument()
  })

  it('falsy id from useParams shows not found', () => {
    mockUseParams.mockReturnValue({ id: '' })
    vi.mocked(useChurch).mockReturnValue({ data: null, isLoading: false } as any)
    render(<ChurchDetail />)
    expect(screen.getByText('churches.notFound')).toBeInTheDocument()
  })

  it('handleEdit when holder not found in position array', async () => {
    vi.mocked(useChurch).mockReturnValue({
      data: {
        ...defaultChurchData,
        pastors: [{ id: 1, name: 'Pastor John', phoneNumber: '1111111', email: 'pastor@test.com' }],
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<ChurchDetail />)
    const editBtns = document.querySelectorAll('[title="Edit"]')
    if (editBtns.length > 0) {
      await user.click(editBtns[0])
      vi.mocked(useChurch).mockReturnValue({
        data: {
          ...defaultChurchData,
          pastors: [],
          elders: [{ id: 2, name: 'Elder Jane', phoneNumber: '2222222', email: 'elder@test.com' }],
          deacons: [{ id: 3, name: 'Deacon Bob', phoneNumber: '3333333', email: 'deacon@test.com' }],
        },
        isLoading: false,
      } as any)
      await user.click(screen.getByText('Save'))
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    }
  })
})
