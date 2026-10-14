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
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', permissions: ['can_read_members'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}))

const mockRecordAsync = vi.fn().mockResolvedValue(undefined)
const contributions = [
  { id: 'c1', contributorName: 'John Doe', amount: 5000, currency: 'NGN', type: 'tithe', notes: 'Monthly tithe', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'c2', contributorName: 'Jane Smith', amount: 100, currency: 'USD', type: 'offering', notes: '', createdAt: '2024-01-10T10:00:00Z' },
]

vi.mock('../hooks/useContributions', () => ({
  useContributionsList: vi.fn(() => ({ data: contributions, isLoading: false })),
  useRecordContribution: vi.fn(() => ({ mutateAsync: mockRecordAsync, isPending: false })),
}))

import Contributions from './Contributions'
import { useContributionsList, useRecordContribution } from '../hooks/useContributions'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useContributionsList).mockReturnValue({ data: contributions, isLoading: false } as any)
  vi.mocked(useRecordContribution).mockReturnValue({ mutateAsync: mockRecordAsync, isPending: false } as any)
})

describe('Contributions', () => {
  it('renders page with title', () => {
    render(<Contributions />)
    expect(screen.getByText('contributions.title')).toBeInTheDocument()
  })

  it('renders contributions data', () => {
    render(<Contributions />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('opens new contribution form', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    expect(screen.getByText('contributions.newContribution', { selector: 'h3' })).toBeInTheDocument()
  })

  it('shows validation error when fields empty', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalled()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    const nameInput = screen.getAllByDisplayValue('')[0]
    await user.type(nameInput, 'Test Member')
    const amountInput = screen.getByRole('spinbutton')
    await user.type(amountInput, '1000')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(mockRecordAsync).toHaveBeenCalledWith(expect.objectContaining({
        contributorName: 'Test Member',
        amount: 1000,
      }))
      expect(showSuccessToast).toHaveBeenCalled()
    })
  })

  it('closes form on cancel', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    await user.click(screen.getByText('common.cancel'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes form on overlay click', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    fireEvent.click(document.querySelector('.dialog-overlay')!)
    expect(screen.queryByText('contributions.newContribution', { selector: 'h3' })).not.toBeInTheDocument()
  })

  it('changes contribution type', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    const selects = screen.getAllByRole('combobox')
    const typeSelect = selects[1]
    await user.selectOptions(typeSelect, 'offering')
    expect(typeSelect).toHaveValue('offering')
  })

  it('changes currency', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    const selects = screen.getAllByRole('combobox')
    const currencySelect = selects[0]
    await user.selectOptions(currencySelect, 'USD')
    expect(currencySelect).toHaveValue('USD')
  })

  it('adds notes', async () => {
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    const textarea = document.querySelector('textarea')
    if (textarea) await user.type(textarea, 'Test notes')
    expect(textarea).toHaveValue('Test notes')
  })

  it('handles record error', async () => {
    mockRecordAsync.mockRejectedValueOnce(new Error('Record failed'))
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    const nameInput = screen.getAllByDisplayValue('')[0]
    await user.type(nameInput, 'Test')
    const amountInput = screen.getByRole('spinbutton')
    await user.type(amountInput, '100')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Record failed')
    })
  })

  it('shows loading state', () => {
    vi.mocked(useContributionsList).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<Contributions />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    vi.mocked(useContributionsList).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Contributions />)
    expect(screen.getByText('common.noData')).toBeInTheDocument()
  })

  it('shows generic error on non-Error failure', async () => {
    mockRecordAsync.mockRejectedValueOnce('boom')
    const user = userEvent.setup()
    render(<Contributions />)
    await user.click(screen.getByText('contributions.newContribution'))
    await user.type(screen.getAllByDisplayValue('')[0], 'Test')
    await user.type(screen.getByRole('spinbutton'), '100')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Record failed')
    })
  })

  it('shows loading text on submit button while pending', () => {
    vi.mocked(useRecordContribution).mockReturnValue({ mutateAsync: mockRecordAsync, isPending: true } as any)
    render(<Contributions />)
    fireEvent.click(screen.getByText('contributions.newContribution'))
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })
})
