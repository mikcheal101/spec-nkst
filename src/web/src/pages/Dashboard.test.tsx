import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'john', permissions: [], churchId: '1', roles: ['MEMBER'] },
  }),
}))
vi.mock('../hooks/useDashboard', () => ({
  useDashboardCounters: vi.fn(),
}))

import Dashboard from './Dashboard'
import { useDashboardCounters } from '../hooks/useDashboard'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Dashboard', () => {
  it('shows skeleton loaders when loading', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({ data: undefined, isLoading: true } as any)
    const { container } = render(<Dashboard />)
    expect(container.querySelectorAll('.skeleton-card').length).toBe(5)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('renders counter values when loaded', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 120, contributions: 50000, churches: 8, projects: 3, announcements: 5, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('formats contributions in K notation', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 50000, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('₦50.0K')).toBeInTheDocument()
  })

  it('formats contributions in M notation', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 2500000, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('₦2.5M')).toBeInTheDocument()
  })

  it('renders daily message from API when available', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 0, churches: 0, projects: 0, announcements: 0, dailyMessage: 'Be strong and courageous' },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText(/Be strong and courageous/)).toBeInTheDocument()
  })

  it('renders welcome text with username', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 0, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('dashboard.welcome')).toBeInTheDocument()
  })

  it('renders stat card labels', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 0, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('dashboard.members')).toBeInTheDocument()
    expect(screen.getByText('dashboard.contributions')).toBeInTheDocument()
    expect(screen.getByText('dashboard.churches')).toBeInTheDocument()
    expect(screen.getByText('dashboard.projects')).toBeInTheDocument()
    expect(screen.getByText('dashboard.announcements')).toBeInTheDocument()
  })

  it('renders description cards section', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 0, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('dashboard.membersDesc')).toBeInTheDocument()
    expect(screen.getByText('dashboard.contributionsDesc')).toBeInTheDocument()
    expect(screen.getByText('dashboard.churchesDesc')).toBeInTheDocument()
    expect(screen.getByText('dashboard.projectsDesc')).toBeInTheDocument()
  })

  it('falls back to 0 for undefined counter properties', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { contributions: undefined, dailyMessage: undefined },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(4)
    expect(screen.getByText('₦0')).toBeInTheDocument()
  })

  it('formats contributions under 1000 in naira', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 500, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('₦500')).toBeInTheDocument()
  })

  it('renders with null user', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 0, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('dashboard.welcome')).toBeInTheDocument()
  })

  it('shows verse reference when no daily message', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 0, churches: 0, projects: 0, announcements: 0, dailyMessage: undefined },
      isLoading: false,
    } as any)
    const { container } = render(<Dashboard />)
    expect(container.querySelector('.verse-ref')).toBeInTheDocument()
  })

  it('hides verse reference when daily message exists', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 0, churches: 0, projects: 0, announcements: 0, dailyMessage: 'Some message' },
      isLoading: false,
    } as any)
    const { container } = render(<Dashboard />)
    expect(container.querySelector('.verse-ref')).not.toBeInTheDocument()
  })

  it('formats contributions of exactly 1000 as K', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 1000, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('₦1.0K')).toBeInTheDocument()
  })

  it('formats contributions of exactly 1000000 as M', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 0, contributions: 1000000, churches: 0, projects: 0, announcements: 0, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('₦1.0M')).toBeInTheDocument()
  })

  it('formats large member counts', () => {
    vi.mocked(useDashboardCounters).mockReturnValue({
      data: { members: 1234, contributions: 0, churches: 100, projects: 50, announcements: 10, dailyMessage: null },
      isLoading: false,
    } as any)
    render(<Dashboard />)
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
