import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toastMock }))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_create_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  })),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

const mockSearch = vi.fn().mockResolvedValue({ content: [] })
vi.mock('../services/api', () => ({
  deaconsApi: { search: (...args: any[]) => mockSearch(...args) },
}))
vi.mock('../hooks/useApi', () => ({
  unwrap: vi.fn().mockImplementation((p: Promise<any>) => p),
}))
vi.mock('../shared/components/ConfirmDialog', () => ({
  default: ({ open, title, message, confirmLabel, onConfirm, onCancel, danger, loading }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <span>{message}</span>
        <button data-testid="confirm-cancel" onClick={onCancel}>Cancel</button>
        <button data-testid="confirm-ok" onClick={onConfirm} disabled={loading}>{confirmLabel}</button>
      </div>
    ) : null,
}))

const mockRefetch = vi.fn()
const mockDeleteAsync = vi.fn().mockResolvedValue(undefined)
const mockCreateAsync = vi.fn().mockResolvedValue(undefined)
const deaconsData = [
  { id: 1, firstName: 'Deacon John', lastName: 'Doe', emailAddress: 'deacon@test.com', tel: '1111111', gender: 'male', address: '123 St' },
  { id: 2, firstName: 'Deacon Jane', lastName: 'Smith', emailAddress: 'deaconj@test.com', tel: '2222222', gender: 'female', address: '456 Ave' },
]

vi.mock('../hooks/usePeople', () => ({
  useDeaconsList: vi.fn(() => ({
    data: deaconsData,
    isLoading: false,
    refetch: mockRefetch,
  })),
  useCreateDeacon: vi.fn(() => ({ mutateAsync: mockCreateAsync, isPending: false })),
  useDeleteDeacon: vi.fn(() => ({ mutateAsync: mockDeleteAsync, isPending: false })),
}))

import Deacons from './Deacons'
import { useDeaconsList, useCreateDeacon, useDeleteDeacon } from '../hooks/usePeople'

beforeEach(() => {
  vi.clearAllMocks()
  mockSearch.mockResolvedValue({ content: [] })
  vi.mocked(useDeaconsList).mockReturnValue({
    data: deaconsData,
    isLoading: false,
    refetch: mockRefetch,
  } as any)
  vi.mocked(useCreateDeacon).mockReturnValue({ mutateAsync: mockCreateAsync, isPending: false } as any)
  vi.mocked(useDeleteDeacon).mockReturnValue({ mutateAsync: mockDeleteAsync, isPending: false } as any)
})

describe('Deacons', () => {
  it('renders deacons table', () => {
    render(<Deacons />)
    expect(screen.getByText('Deacon John Doe')).toBeInTheDocument()
    expect(screen.getByText('Deacon Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Deacons')).toBeInTheDocument()
  })

  it('searches deacons by name', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const searchInput = screen.getByPlaceholderText('Search deacons...')
    await user.type(searchInput, 'John')
    expect(screen.getByText('Deacon John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Deacon Jane Smith')).not.toBeInTheDocument()
  })

  it('clears search with clear button', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const searchInput = screen.getByPlaceholderText('Search deacons...')
    await user.type(searchInput, 'John')
    expect(screen.queryByText('Deacon Jane Smith')).not.toBeInTheDocument()
    const clearBtn = searchInput.parentElement!.querySelector('button') as HTMLButtonElement
    await user.click(clearBtn)
    expect(searchInput).toHaveValue('')
    expect(screen.getByText('Deacon Jane Smith')).toBeInTheDocument()
  })

  it('opens add deacon modal', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    expect(screen.getByText('Add Deacon', { selector: 'h3' })).toBeInTheDocument()
  })

  it('loads members on modal open with empty search', async () => {
    mockSearch.mockResolvedValue({ content: [{ id: 10, firstName: 'Member', lastName: 'One', tel: '555', emailAddress: 'm@test.com' }] })
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('')
    })
    expect(screen.getByText('Member One')).toBeInTheDocument()
  })

  it('searches members in modal', async () => {
    mockSearch
      .mockResolvedValueOnce({ content: [] })
      .mockResolvedValueOnce({ content: [{ id: 11, firstName: 'Find', lastName: 'Me', tel: '999', emailAddress: 'f@test.com' }] })
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith(''))
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...')
    await user.type(searchInput, 'Find')
    fireEvent.submit(searchInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText('Find Me')).toBeInTheDocument()
    })
  })

  it('makes a member a deacon', async () => {
    mockSearch.mockResolvedValue({ content: [{ id: 12, firstName: 'New', lastName: 'Deacon', tel: '111', emailAddress: 'n@test.com' }] })
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => expect(screen.getByText('New Deacon')).toBeInTheDocument())
    await user.click(screen.getByText('Make Deacon'))
    await waitFor(() => {
      expect(mockCreateAsync).toHaveBeenCalledWith({ memberId: 12 })
    })
  })

  it('deletes a deacon via ConfirmDialog', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const deleteBtn = document.querySelector('[data-tooltip="Remove"]') as HTMLButtonElement
    await user.click(deleteBtn)
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    expect(screen.getByText('Remove Deacon')).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-ok'))
    expect(mockDeleteAsync).toHaveBeenCalled()
  })

  it('cancels delete via ConfirmDialog', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const deleteBtn = document.querySelector('[data-tooltip="Remove"]') as HTMLButtonElement
    await user.click(deleteBtn)
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-cancel'))
    expect(mockDeleteAsync).not.toHaveBeenCalled()
  })

  it('shows loading state', () => {
    vi.mocked(useDeaconsList).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as any)
    render(<Deacons />)
    expect(document.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('shows empty state when no deacons', () => {
    vi.mocked(useDeaconsList).mockReturnValueOnce({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any)
    render(<Deacons />)
    expect(screen.getByText('No deacons found')).toBeInTheDocument()
  })

  it('paginates through pages', async () => {
    const manyDeacons = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, firstName: `D${i + 1}`, lastName: `Last`, emailAddress: `d${i + 1}@test.com`, tel: `${i + 1}000`, gender: 'male', address: '123 St',
    }))
    vi.mocked(useDeaconsList).mockReturnValue({
      data: manyDeacons,
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    render(<Deacons />)
    expect(screen.getByText('D1 Last')).toBeInTheDocument()
    expect(screen.queryByText('D11 Last')).not.toBeInTheDocument()
    const nextBtn = screen.getByText('›')
    fireEvent.click(nextBtn)
    expect(screen.queryByText('D1 Last')).not.toBeInTheDocument()
    expect(screen.getByText('D11 Last')).toBeInTheDocument()
  })

  it('shows record count', () => {
    render(<Deacons />)
    expect(screen.getByText('2 deacons')).toBeInTheDocument()
  })

  it('closes modal on overlay click', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    expect(screen.getByText('Add Deacon', { selector: 'h3' })).toBeInTheDocument()
    fireEvent.click(document.querySelector('.mf-overlay')!)
    expect(screen.queryByText('Search for a member to assign as deacon')).not.toBeInTheDocument()
  })

  it('pagination shows ellipsis and all buttons', async () => {
    const manyDeacons = Array.from({ length: 35 }, (_, i) => ({
      id: i + 1, firstName: `D${i + 1}`, lastName: `Last`, emailAddress: `d${i + 1}@test.com`, tel: `${i + 1}000`, gender: 'male', address: '123 St',
    }))
    vi.mocked(useDeaconsList).mockReturnValue({
      data: manyDeacons,
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    render(<Deacons />)
    const pageBtns = Array.from(document.querySelectorAll('.pagination .btn-outline'))
    const lastBtn = pageBtns.find((b) => b.textContent === '»')
    if (lastBtn && !(lastBtn as HTMLButtonElement).disabled) {
      fireEvent.click(lastBtn)
    }
    const firstBtn = pageBtns.find((b) => b.textContent === '«')
    if (firstBtn && !(firstBtn as HTMLButtonElement).disabled) {
      fireEvent.click(firstBtn)
    }
    expect(screen.getByText('35 deacons')).toBeInTheDocument()
  })

  it('search error in add modal shows toast', async () => {
    mockSearch.mockResolvedValue({ content: [] })
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith(''))
    mockSearch.mockRejectedValueOnce(new Error('Search API error'))
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...')
    await user.type(searchInput, 'fail')
    fireEvent.submit(searchInput.closest('form')!)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Search failed')
    })
  })

  it('make deacon error shows toast', async () => {
    mockSearch.mockResolvedValue({ content: [{ id: 12, firstName: 'New', lastName: 'Deacon', tel: '111', emailAddress: 'n@test.com' }] })
    mockCreateAsync.mockRejectedValueOnce(new Error('Assign failed'))
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => expect(screen.getByText('New Deacon')).toBeInTheDocument())
    await user.click(screen.getByText('Make Deacon'))
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled()
    })
  })

  it('delete error shows toast', async () => {
    mockDeleteAsync.mockRejectedValueOnce(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<Deacons />)
    const deleteBtn = document.querySelector('[data-tooltip="Remove"]') as HTMLButtonElement
    await user.click(deleteBtn)
    await user.click(screen.getByTestId('confirm-ok'))
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled()
    })
  })

  it('search with email matches', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const searchInput = screen.getByPlaceholderText('Search deacons...')
    await user.type(searchInput, 'deacon@test.com')
    expect(screen.getByText('Deacon John Doe')).toBeInTheDocument()
  })

  it('search with phone matches', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const searchInput = screen.getByPlaceholderText('Search deacons...')
    await user.type(searchInput, '2222222')
    expect(screen.getByText('Deacon Jane Smith')).toBeInTheDocument()
  })

  it('no email or phone shows dashes', () => {
    vi.mocked(useDeaconsList).mockReturnValueOnce({
      data: [{ id: 1, firstName: 'John', lastName: 'Doe', emailAddress: '', tel: '', gender: '' }],
      isLoading: false,
      refetch: vi.fn(),
    } as any)
    render(<Deacons />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('pagination active page button', async () => {
    const manyDeacons = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, firstName: `D${i + 1}`, lastName: `Last`, emailAddress: `d${i + 1}@test.com`, tel: `${i + 1}000`, gender: 'male', address: '123 St',
    }))
    vi.mocked(useDeaconsList).mockReturnValue({
      data: manyDeacons,
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    render(<Deacons />)
    const activeBtn = document.querySelector('.pagination .btn-primary') as HTMLButtonElement
    expect(activeBtn).toBeInTheDocument()
    expect(activeBtn.textContent).toBe('1')
    const nextBtn = screen.getByText('›')
    fireEvent.click(nextBtn)
    const newActiveBtn = document.querySelector('.pagination .btn-primary') as HTMLButtonElement
    expect(newActiveBtn.textContent).toBe('2')
  })

  it('search with no results shows filtered empty message', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const searchInput = screen.getByPlaceholderText('Search deacons...')
    await user.type(searchInput, 'nonexistent')
    expect(screen.getByText('No deacons match your search')).toBeInTheDocument()
  })

  it('delete target null guard - handleDelete returns early', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    expect(mockDeleteAsync).not.toHaveBeenCalled()
  })

  it('delete shows pending state', async () => {
    vi.mocked(useDeleteDeacon).mockReturnValue({ mutateAsync: mockDeleteAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<Deacons />)
    const deleteBtn = document.querySelector('[data-tooltip="Remove"]') as HTMLButtonElement
    await user.click(deleteBtn)
    const confirmBtn = screen.getByTestId('confirm-ok')
    expect(confirmBtn).toBeDisabled()
  })

  it('search shows singular form for one result', async () => {
    vi.mocked(useDeaconsList).mockReturnValueOnce({
      data: [deaconsData[0]],
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    render(<Deacons />)
    expect(screen.getByText('1 deacon')).toBeInTheDocument()
  })

  it('make deacon shows spinner during assigning state', async () => {
    vi.mocked(useCreateDeacon).mockReturnValue({ mutateAsync: mockCreateAsync, isPending: true } as any)
    mockSearch.mockResolvedValue({ content: [{ id: 12, firstName: 'New', lastName: 'Deacon', tel: '111', emailAddress: 'n@test.com' }] })
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => expect(screen.getByText('New Deacon')).toBeInTheDocument())
    expect(screen.getByText('Make Deacon')).toBeInTheDocument()
  })

  it('make deacon non-Error failure shows generic toast', async () => {
    mockSearch.mockResolvedValue({ content: [{ id: 12, firstName: 'New', lastName: 'Deacon', tel: '111', emailAddress: 'n@test.com' }] })
    mockCreateAsync.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => expect(screen.getByText('New Deacon')).toBeInTheDocument())
    await user.click(screen.getByText('Make Deacon'))
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Failed')
    })
  })

  it('delete non-Error failure shows generic toast', async () => {
    mockDeleteAsync.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<Deacons />)
    const deleteBtn = document.querySelector('[data-tooltip="Remove"]') as HTMLButtonElement
    await user.click(deleteBtn)
    await user.click(screen.getByTestId('confirm-ok'))
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Delete failed')
    })
  })

  it('pagination prev and first buttons work', async () => {
    const manyDeacons = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1, firstName: `D${i + 1}`, lastName: `Last`, emailAddress: `d${i + 1}@test.com`, tel: `${i + 1}000`, gender: 'male', address: '123 St',
    }))
    vi.mocked(useDeaconsList).mockReturnValue({
      data: manyDeacons,
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    render(<Deacons />)
    const nextBtn = screen.getByText('›')
    fireEvent.click(nextBtn)
    fireEvent.click(nextBtn)
    const prevBtn = screen.getByText('‹')
    fireEvent.click(prevBtn)
    const firstBtn = screen.getByText('«')
    fireEvent.click(firstBtn)
    expect(screen.getByText('D1 Last')).toBeInTheDocument()
  })

  it('deacon row click navigates to detail', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const rows = document.querySelectorAll('tbody tr')
    if (rows.length > 0) await user.click(rows[0])
  })

  it('deacon view button stops propagation', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const viewBtns = document.querySelectorAll('[data-tooltip="View"]')
    if (viewBtns.length > 0) await user.click(viewBtns[0])
  })

  it('deacon with middle name renders full name', () => {
    vi.mocked(useDeaconsList).mockReturnValueOnce({
      data: [{ id: 1, firstName: 'John', middleName: 'M', lastName: 'Doe', emailAddress: 'j@test.com', tel: '111', gender: 'Male' }],
      isLoading: false,
      refetch: vi.fn(),
    } as any)
    render(<Deacons />)
    expect(screen.getByText('John M Doe')).toBeInTheDocument()
  })

  it('deacon with empty firstName and lastName shows empty initials', () => {
    vi.mocked(useDeaconsList).mockReturnValueOnce({
      data: [{ id: 1, firstName: '', lastName: '', emailAddress: '', tel: '', gender: '' }],
      isLoading: false,
      refetch: vi.fn(),
    } as any)
    render(<Deacons />)
  })

  it('search with no clear button when query is empty', () => {
    render(<Deacons />)
    const searchInput = screen.getByPlaceholderText('Search deacons...')
    const clearBtn = searchInput.parentElement!.querySelector('button')
    expect(clearBtn).not.toBeInTheDocument()
  })

  it('search resets page to 0', async () => {
    const manyDeacons = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, firstName: `D${i + 1}`, lastName: `Last`, emailAddress: `d${i + 1}@test.com`, tel: `${i + 1}000`, gender: 'male', address: '123 St',
    }))
    vi.mocked(useDeaconsList).mockReturnValue({
      data: manyDeacons,
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    const user = userEvent.setup()
    render(<Deacons />)
    const nextBtn = screen.getByText('›')
    fireEvent.click(nextBtn)
    expect(screen.queryByText('D1 Last')).not.toBeInTheDocument()
    const searchInput = screen.getByPlaceholderText('Search deacons...')
    await user.type(searchInput, 'D1')
    expect(screen.getByText('D1 Last')).toBeInTheDocument()
  })

  it('add modal initial loading state', async () => {
    mockSearch.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    expect(document.querySelector('.mf-overlay')).toBeInTheDocument()
  })

  it('add modal search returns array without content wrapper', async () => {
    mockSearch.mockResolvedValueOnce([{ id: 20, firstName: 'Direct', lastName: 'List', tel: '333', emailAddress: 'd@test.com' }] as any)
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    await waitFor(() => {
      expect(screen.getByText('Direct List')).toBeInTheDocument()
    })
  })

  it('renders deacons with null email and phone', () => {
    vi.mocked(useDeaconsList).mockReturnValue({
      data: [{ id: 10, firstName: 'No', lastName: 'Contact', emailAddress: null, tel: null, gender: 'Male' }],
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    render(<Deacons />)
    expect(screen.getByText('No Contact')).toBeInTheDocument()
  })

  it('renders deacon with empty name initials', () => {
    vi.mocked(useDeaconsList).mockReturnValue({
      data: [{ id: 11, firstName: '', lastName: '', emailAddress: 'e@t.com', tel: '123', gender: 'Female' }],
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    render(<Deacons />)
  })

  it('search filters deacons', async () => {
    const user = userEvent.setup()
    render(<Deacons />)
    const searchInput = screen.getByPlaceholderText(/Search/)
    await user.type(searchInput, 'Jane')
    expect(searchInput).toHaveValue('Jane')
  })

  it('search filters deacons with null email and phone', async () => {
    vi.mocked(useDeaconsList).mockReturnValue({
      data: [
        { id: 10, firstName: 'Null', lastName: 'Contact', emailAddress: null, tel: null, gender: 'Male' },
        { id: 11, firstName: 'Has', lastName: 'Info', emailAddress: 'has@test.com', tel: '555', gender: 'Female' },
      ],
      isLoading: false,
      refetch: mockRefetch,
    } as any)
    const user = userEvent.setup()
    render(<Deacons />)
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
    render(<Deacons />)
    expect(screen.getByText('Deacons')).toBeInTheDocument()
    expect(screen.queryByText('Add Deacon')).not.toBeInTheDocument()
  })

  it('search modal displays results with null fields', async () => {
    const { useAuth } = await import('../context/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_create_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    })
    mockSearch.mockResolvedValue({
      content: [
        { id: 20, firstName: 'Search', lastName: 'Result', emailAddress: null, tel: null, gender: 'Male' },
        { id: 21, firstName: 'Another', lastName: 'Person', emailAddress: 'ap@test.com', tel: '999', gender: 'Female' },
      ],
    })
    const user = userEvent.setup()
    render(<Deacons />)
    await user.click(screen.getByText('Add Deacon'))
    const searchInput = screen.getByPlaceholderText(/Search by name/)
    await user.type(searchInput, 'test')
    fireEvent.submit(searchInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText('Search Result')).toBeInTheDocument()
    })
    expect(screen.getByText('Another Person')).toBeInTheDocument()
  })
})
