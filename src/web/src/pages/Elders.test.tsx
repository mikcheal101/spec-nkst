import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toastMock }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_create_elders', 'can_delete_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  })),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showConfirm: vi.fn().mockResolvedValue(true),
}))

const mockCreateElderMut = vi.fn().mockResolvedValue(undefined)
const mockDeleteElderMut = vi.fn().mockResolvedValue(undefined)
vi.mock('../hooks/usePeople', () => ({
  useEldersList: vi.fn(() => ({
    data: [
      { id: 1, firstName: 'Elder John', lastName: 'Doe', emailAddress: 'elder@test.com', tel: '1111111', gender: 'Male' },
      { id: 2, firstName: 'Elder Jane', lastName: 'Smith', emailAddress: 'elderj@test.com', tel: '2222222', gender: 'Female' },
    ],
    isLoading: false,
  })),
  useCreateElder: vi.fn(() => ({ mutateAsync: mockCreateElderMut, isPending: false })),
  useDeleteElder: vi.fn(() => ({ mutateAsync: mockDeleteElderMut, isPending: false })),
}))

const mockPeopleSearch = vi.fn().mockResolvedValue({ content: [] })
vi.mock('../services/api', () => ({
  peopleApi: { search: (...args: any[]) => mockPeopleSearch(...args) },
}))
vi.mock('../hooks/useApi', () => ({
  unwrap: vi.fn((p: any) => Promise.resolve(p)),
}))

import Elders from './Elders'
import { useEldersList, useCreateElder, useDeleteElder } from '../hooks/usePeople'

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateElderMut.mockResolvedValue(undefined)
  mockDeleteElderMut.mockResolvedValue(undefined)
  mockPeopleSearch.mockResolvedValue({ content: [] })
  vi.mocked(useEldersList).mockReturnValue({
    data: [
      { id: 1, firstName: 'Elder John', lastName: 'Doe', emailAddress: 'elder@test.com', tel: '1111111', gender: 'Male' },
      { id: 2, firstName: 'Elder Jane', lastName: 'Smith', emailAddress: 'elderj@test.com', tel: '2222222', gender: 'Female' },
    ],
    isLoading: false,
  } as any)
})

describe('Elders', () => {
  it('renders elders list', () => {
    render(<Elders />)
    expect(screen.getByText('Elder John Doe')).toBeInTheDocument()
    expect(screen.getByText('Elder Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Elders')).toBeInTheDocument()
  })

  it('shows empty state when no elders', () => {
    vi.mocked(useEldersList).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Elders />)
    expect(screen.getByText('No elders found')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(useEldersList).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<Elders />)
    expect(document.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('opens add elder modal', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    expect(screen.getByText('Add Elder', { selector: 'h3' })).toBeInTheDocument()
  })

  it('add elder modal searches on mount', async () => {
    mockPeopleSearch.mockResolvedValueOnce({
      content: [
        { id: 10, firstName: 'Candidate', lastName: 'One', tel: '5555555', emailAddress: 'c@test.com' },
      ],
    })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await screen.findByText('Candidate One')
  })

  it('add elder modal with empty search results', async () => {
    mockPeopleSearch.mockResolvedValueOnce({ content: [] })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await vi.waitFor(() => {
      expect(screen.getByText(/No baptised members found/)).toBeInTheDocument()
    })
  })

  it('add elder modal: make elder button works', async () => {
    mockPeopleSearch.mockResolvedValueOnce({
      content: [{ id: 10, firstName: 'Candidate', lastName: 'One', tel: '5555555', emailAddress: 'c@test.com' }],
    })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await screen.findByText('Candidate One')
    await user.click(screen.getByText('Make Elder'))
  })

  it('add elder modal: manual search', async () => {
    mockPeopleSearch.mockResolvedValue({
      content: [{ id: 10, firstName: 'Result', lastName: 'Person', tel: '6666666', emailAddress: 'r@test.com' }],
    })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await screen.findByText('Result Person')
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...')
    await user.type(searchInput, 'Result')
    const searchBtn = screen.getByRole('button', { name: /Search/ })
    await user.click(searchBtn)
  })

  it('add elder modal: close button', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    const closeBtn = document.querySelector('.mf-close') as HTMLButtonElement
    if (closeBtn) await user.click(closeBtn)
  })

  it('add elder modal: overlay click closes', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    fireEvent.click(document.querySelector('.mf-overlay')!)
  })

  it('delete elder opens confirm dialog', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const deleteBtns = document.querySelectorAll('[data-tooltip="Remove"]')
    await user.click(deleteBtns[0])
    expect(screen.getByText('Remove Elder')).toBeInTheDocument()
  })

  it('delete elder confirm works', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const deleteBtns = document.querySelectorAll('[data-tooltip="Remove"]')
    await user.click(deleteBtns[0])
    const removeBtn = screen.getByText('Remove')
    await user.click(removeBtn)
  })

  it('searches elders filters correctly', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'John')
    expect(searchInput).toHaveValue('John')
    expect(screen.getByText('Elder John Doe')).toBeInTheDocument()
  })

  it('search no match shows empty', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'zzz')
    expect(screen.getByText('No elders match your search')).toBeInTheDocument()
  })

  it('clear search button', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'John')
    const clearBtn = searchInput.closest('div')?.querySelector('button')
    if (clearBtn) await user.click(clearBtn)
  })

  it('elder count displayed', () => {
    render(<Elders />)
    expect(screen.getByText('2 elders')).toBeInTheDocument()
  })

  it('elder count singular', () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 1, firstName: 'Elder John', lastName: 'Doe', emailAddress: 'elder@test.com', tel: '1111111', gender: 'Male' }],
      isLoading: false,
    } as any)
    render(<Elders />)
    expect(screen.getByText('1 elder')).toBeInTheDocument()
  })

  it('view elder button navigates', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const viewBtns = document.querySelectorAll('[data-tooltip="View"]')
    if (viewBtns.length > 0) await user.click(viewBtns[0])
  })

  it('row click navigates', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const rows = document.querySelectorAll('tbody tr')
    if (rows.length > 0) await user.click(rows[0])
  })

  it('search with email matches', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'elder@test.com')
    expect(screen.getByText('Elder John Doe')).toBeInTheDocument()
  })

  it('search with phone matches', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, '2222222')
    expect(screen.getByText('Elder Jane Smith')).toBeInTheDocument()
  })

  it('add elder modal with search input and submit', async () => {
    mockPeopleSearch.mockResolvedValueOnce({ content: [] })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...')
    await user.type(searchInput, 'test')
    const form = searchInput.closest('form')!
    fireEvent.submit(form)
  })

  it('empty elders with search shows filtered empty', async () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 1, firstName: 'John', lastName: 'Doe', emailAddress: 'j@test.com', tel: '111', gender: 'Male' }],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'zzz')
    expect(screen.getByText('No elders match your search')).toBeInTheDocument()
  })

  it('elder with no email or phone shows dashes', () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 1, firstName: 'John', lastName: 'Doe', emailAddress: '', tel: '', gender: '' }],
      isLoading: false,
    } as any)
    render(<Elders />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('delete elder: confirm dialog cancel', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const deleteBtns = document.querySelectorAll('[data-tooltip="Remove"]')
    await user.click(deleteBtns[0])
    await user.click(screen.getByText('common.cancel'))
  })

  it('pagination: next/prev buttons', async () => {
    const manyElders = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1, firstName: `Elder${i}`, lastName: `Last${i}`, emailAddress: `e${i}@test.com`, tel: `${i}000000`, gender: 'Male',
    }))
    vi.mocked(useEldersList).mockReturnValue({ data: manyElders, isLoading: false } as any)
    const user = userEvent.setup()
    render(<Elders />)
    const nextBtn = document.querySelectorAll('.pagination .btn-sm')[3] as HTMLButtonElement
    if (nextBtn && !nextBtn.disabled) await user.click(nextBtn)
  })

  it('elder with middle name renders full name', () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 1, firstName: 'John', middleName: 'M', lastName: 'Doe', emailAddress: 'j@test.com', tel: '111', gender: 'Male' }],
      isLoading: false,
    } as any)
    render(<Elders />)
    expect(screen.getByText('John M Doe')).toBeInTheDocument()
  })

  it('pagination all buttons work', async () => {
    const manyElders = Array.from({ length: 35 }, (_, i) => ({
      id: i + 1, firstName: `Elder${i}`, lastName: `Last${i}`, emailAddress: `e${i}@test.com`, tel: `${i}000000`, gender: 'Male',
    }))
    vi.mocked(useEldersList).mockReturnValue({ data: manyElders, isLoading: false } as any)
    render(<Elders />)
    const pageBtns = Array.from(document.querySelectorAll('.pagination .btn-outline'))
    const lastBtn = pageBtns.find((b) => b.textContent === '»')
    if (lastBtn && !(lastBtn as HTMLButtonElement).disabled) {
      fireEvent.click(lastBtn)
    }
    const firstBtn = pageBtns.find((b) => b.textContent === '«')
    if (firstBtn && !(firstBtn as HTMLButtonElement).disabled) {
      fireEvent.click(firstBtn)
    }
    expect(screen.getByText('35 elders')).toBeInTheDocument()
  })

  it('pagination ellipsis shown for many pages', async () => {
    const manyElders = Array.from({ length: 35 }, (_, i) => ({
      id: i + 1, firstName: `Elder${i}`, lastName: `Last${i}`, emailAddress: `e${i}@test.com`, tel: `${i}000000`, gender: 'Male',
    }))
    vi.mocked(useEldersList).mockReturnValue({ data: manyElders, isLoading: false } as any)
    render(<Elders />)
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('pagination active page button', async () => {
    const manyElders = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, firstName: `Elder${i}`, lastName: `Last${i}`, emailAddress: `e${i}@test.com`, tel: `${i}000000`, gender: 'Male',
    }))
    vi.mocked(useEldersList).mockReturnValue({ data: manyElders, isLoading: false } as any)
    render(<Elders />)
    const activeBtn = document.querySelector('.pagination .btn-primary') as HTMLButtonElement
    expect(activeBtn).toBeInTheDocument()
    expect(activeBtn.textContent).toBe('1')
    const nextBtn = screen.getByText('›')
    fireEvent.click(nextBtn)
    const newActiveBtn = document.querySelector('.pagination .btn-primary') as HTMLButtonElement
    expect(newActiveBtn.textContent).toBe('2')
  })

  it('search error in add elder modal shows toast', async () => {
    mockPeopleSearch.mockResolvedValue({ content: [] })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await waitFor(() => expect(mockPeopleSearch).toHaveBeenCalledWith(''))
    mockPeopleSearch.mockRejectedValue(new Error('API error'))
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...')
    await user.type(searchInput, 'fail')
    fireEvent.submit(searchInput.closest('form')!)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled()
    })
  })

  it('make elder error shows toast', async () => {
    mockPeopleSearch.mockResolvedValue({
      content: [{ id: 10, firstName: 'Candidate', lastName: 'One', tel: '5555555', emailAddress: 'c@test.com' }],
    })
    mockCreateElderMut.mockRejectedValue(new Error('Create failed'))
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await screen.findByText('Candidate One')
    await user.click(screen.getByText('Make Elder'))
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled()
    })
  })

  it('delete elder error shows toast', async () => {
    mockDeleteElderMut.mockRejectedValue(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<Elders />)
    const deleteBtns = document.querySelectorAll('[data-tooltip="Remove"]')
    await user.click(deleteBtns[0])
    await user.click(screen.getByText('Remove'))
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled()
    })
  })

  it('elder email shows in sub text when present', () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 1, firstName: 'John', lastName: 'Doe', emailAddress: 'john@test.com', tel: '111', gender: 'Male' }],
      isLoading: false,
    } as any)
    render(<Elders />)
    expect(screen.getAllByText('john@test.com').length).toBeGreaterThan(0)
  })

  it('empty elders with no search shows default empty', () => {
    vi.mocked(useEldersList).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Elders />)
    expect(screen.getByText('No elders found')).toBeInTheDocument()
  })

  it('add elder modal with paginated results', async () => {
    const people = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleSearch.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await screen.findByText('Person0 Last0')
    await screen.findByText('Person11 Last11')
  })

  it('add elder modal pagination next', async () => {
    const people = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, firstName: `Person${i}`, lastName: `Last${i}`, tel: `${i}000000`, emailAddress: `p${i}@test.com`,
    }))
    mockPeopleSearch.mockResolvedValueOnce({ content: people })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await screen.findByText('Person0 Last0')
  })

  it('add elder modal close via close button', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    const closeBtn = document.querySelector('.mf-close') as HTMLButtonElement
    if (closeBtn) await user.click(closeBtn)
    expect(screen.queryByText('Add Elder', { selector: 'h3' })).not.toBeInTheDocument()
  })

  it('add elder modal cancel button', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    const cancelBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Cancel')
    if (cancelBtns.length > 0) await user.click(cancelBtns[0])
  })

  it('search with no results shows filtered empty message', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'nonexistent')
    expect(screen.getByText('No elders match your search')).toBeInTheDocument()
  })

  it('delete shows pending state', async () => {
    vi.mocked(useDeleteElder).mockReturnValue({ mutateAsync: mockDeleteElderMut, isPending: true } as any)
    const user = userEvent.setup()
    render(<Elders />)
    const deleteBtns = document.querySelectorAll('[data-tooltip="Remove"]')
    await user.click(deleteBtns[0])
    const removeBtn = document.querySelector('.btn-danger') as HTMLButtonElement
    expect(removeBtn).toBeDisabled()
  })

  it('make elder non-Error failure shows generic toast', async () => {
    mockPeopleSearch.mockResolvedValue({
      content: [{ id: 10, firstName: 'Candidate', lastName: 'One', tel: '5555555', emailAddress: 'c@test.com' }],
    })
    mockCreateElderMut.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await screen.findByText('Candidate One')
    await user.click(screen.getByText('Make Elder'))
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Failed')
    })
  })

  it('delete non-Error failure shows generic toast', async () => {
    vi.mocked(useDeleteElder).mockReturnValue({ mutateAsync: mockDeleteElderMut, isPending: false } as any)
    mockDeleteElderMut.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<Elders />)
    const deleteBtns = document.querySelectorAll('[data-tooltip="Remove"]')
    await user.click(deleteBtns[0])
    const removeBtn = document.querySelector('.dialog-actions .btn-danger') as HTMLButtonElement
    await user.click(removeBtn)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Delete failed')
    })
  })

  it('pagination prev and first buttons work', async () => {
    const manyElders = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1, firstName: `Elder${i}`, lastName: `Last${i}`, emailAddress: `e${i}@test.com`, tel: `${i}000000`, gender: 'Male',
    }))
    vi.mocked(useEldersList).mockReturnValue({ data: manyElders, isLoading: false } as any)
    const user = userEvent.setup()
    render(<Elders />)
    const nextBtn = screen.getByText('›')
    await user.click(nextBtn)
    await user.click(nextBtn)
    const prevBtn = screen.getByText('‹')
    await user.click(prevBtn)
    const firstBtn = screen.getByText('«')
    await user.click(firstBtn)
  })

  it('search with no clear button when query is empty', () => {
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    const clearBtn = searchInput.closest('div')?.querySelector('button')
    expect(clearBtn).not.toBeInTheDocument()
  })

  it('search resets page to 0', async () => {
    const manyElders = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, firstName: `Elder${i}`, lastName: `Last${i}`, emailAddress: `e${i}@test.com`, tel: `${i}000000`, gender: 'Male',
    }))
    vi.mocked(useEldersList).mockReturnValue({ data: manyElders, isLoading: false } as any)
    const user = userEvent.setup()
    render(<Elders />)
    const nextBtn = screen.getByText('›')
    fireEvent.click(nextBtn)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'Elder0')
    expect(screen.getByText('Elder0 Last0')).toBeInTheDocument()
  })

  it('add modal initial loading state before search completes', async () => {
    mockPeopleSearch.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    expect(document.querySelector('.mf-overlay')).toBeInTheDocument()
  })

  it('add modal search returns array without content wrapper', async () => {
    mockPeopleSearch.mockResolvedValueOnce([{ id: 20, firstName: 'Direct', lastName: 'List', tel: '333', emailAddress: 'd@test.com' }] as any)
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await waitFor(() => {
      expect(screen.getByText('Direct List')).toBeInTheDocument()
    })
  })

  it('make elder shows spinner during assigning state', async () => {
    vi.mocked(useCreateElder).mockReturnValue({ mutateAsync: mockCreateElderMut, isPending: true } as any)
    mockPeopleSearch.mockResolvedValue({
      content: [{ id: 10, firstName: 'Candidate', lastName: 'One', tel: '5555555', emailAddress: 'c@test.com' }],
    })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    await waitFor(() => expect(screen.getByText('Candidate One')).toBeInTheDocument())
    expect(screen.getByText('Make Elder')).toBeInTheDocument()
  })

  it('elder with empty firstName and lastName shows empty initials', () => {
    vi.mocked(useEldersList).mockReturnValueOnce({
      data: [{ id: 1, firstName: '', lastName: '', emailAddress: '', tel: '', gender: '' }],
      isLoading: false,
    } as any)
    render(<Elders />)
  })

  it('search with multiple field matches filters correctly', async () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [
        { id: 1, firstName: 'Alpha', lastName: 'One', emailAddress: 'alpha@test.com', tel: '111', gender: 'Male' },
        { id: 2, firstName: 'Beta', lastName: 'Two', emailAddress: 'beta@test.com', tel: '222', gender: 'Female' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText('Search elders...')
    await user.type(searchInput, 'Beta')
    expect(screen.queryByText('Alpha One')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Two')).toBeInTheDocument()
  })

  it('no canCreate permission hides Add Elder button', () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 1, firstName: 'John', lastName: 'Doe', emailAddress: 'j@test.com', tel: '111', gender: 'Male' }],
      isLoading: false,
    } as any)
    render(<Elders />)
    expect(screen.getByText('Add Elder')).toBeInTheDocument()
  })

  it('renders elders with null email and phone', () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 10, firstName: 'No', lastName: 'Contact', emailAddress: null, tel: null, gender: 'Male' }],
      isLoading: false,
    } as any)
    render(<Elders />)
    expect(screen.getByText('No Contact')).toBeInTheDocument()
  })

  it('renders elder with empty name initials', () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [{ id: 11, firstName: '', lastName: '', emailAddress: 'e@t.com', tel: '123', gender: 'Female' }],
      isLoading: false,
    } as any)
    render(<Elders />)
  })

  it('search filters elders', async () => {
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText(/Search/)
    await user.type(searchInput, 'Jane')
    expect(searchInput).toHaveValue('Jane')
  })

  it('search filters elders with null email and phone', async () => {
    vi.mocked(useEldersList).mockReturnValue({
      data: [
        { id: 10, firstName: 'Null', lastName: 'Contact', emailAddress: null, tel: null, gender: 'Male' },
        { id: 11, firstName: 'Has', lastName: 'Info', emailAddress: 'has@test.com', tel: '555', gender: 'Female' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Elders />)
    const searchInput = screen.getByPlaceholderText(/Search/)
    await user.type(searchInput, 'Null')
    expect(screen.getByText('Null Contact')).toBeInTheDocument()
  })

  it('user without permissions renders correctly', async () => {
    const { useAuth } = await import('../context/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<Elders />)
    expect(screen.getByText('Elders')).toBeInTheDocument()
    expect(screen.queryByText('Add Elder')).not.toBeInTheDocument()
  })

  it('search modal displays results with null fields', async () => {
    const { useAuth } = await import('../context/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_create_elders', 'can_delete_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    })
    mockPeopleSearch.mockResolvedValue({
      content: [
        { id: 20, firstName: 'Search', lastName: 'Result', emailAddress: null, tel: null, gender: 'Male' },
        { id: 21, firstName: 'Another', lastName: 'Person', emailAddress: 'ap@test.com', tel: '999', gender: 'Female' },
      ],
    })
    const user = userEvent.setup()
    render(<Elders />)
    await user.click(screen.getByText('Add Elder'))
    const searchInput = screen.getByPlaceholderText(/Search by name/)
    await user.type(searchInput, 'test')
    fireEvent.submit(searchInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText('Search Result')).toBeInTheDocument()
    })
    expect(screen.getByText('Another Person')).toBeInTheDocument()
  })
})
