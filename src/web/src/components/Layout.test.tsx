import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockLogout, mockChangeLanguage, mockAuthData } = vi.hoisted(() => {
  const authData = {
    user: {
      username: 'admin',
      permissions: ['can_read_church', 'can_read_members', 'can_read_contribution', 'can_read_announcements'] as string[],
      churchId: '1',
      roles: ['ADMIN'],
    },
    logout: vi.fn(),
    loading: false,
  } as any
  return {
    mockLogout: authData.logout,
    mockChangeLanguage: vi.fn(),
    mockAuthData: authData,
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: mockChangeLanguage } }),
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthData,
}))

import Layout from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout>Child content</Layout>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('renders children', () => {
    renderLayout()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders brand name', () => {
    renderLayout()
    expect(screen.getByText('NKST')).toBeInTheDocument()
    expect(screen.getByText('Nongo u Kristu u ken Sudan hen Tiv')).toBeInTheDocument()
  })

  it('renders sidebar navigation items based on permissions', () => {
    renderLayout()
    expect(screen.getAllByText('nav.dashboard').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('nav.churches')).toBeInTheDocument()
    expect(screen.getByText('nav.members')).toBeInTheDocument()
    expect(screen.getByText('nav.contributions')).toBeInTheDocument()
    expect(screen.getByText('nav.announcements')).toBeInTheDocument()
  })

  it('matches permissions case-insensitively', () => {
    const saved = { ...mockAuthData.user }
    mockAuthData.user = { ...saved, permissions: ['CAN_READ_ANNOUNCEMENTS', 'CAN_READ_MEMBERS', 'CAN_READ_CHURCH'] }
    renderLayout()
    expect(screen.getByText('nav.announcements')).toBeInTheDocument()
    expect(screen.getByText('nav.members')).toBeInTheDocument()
    expect(screen.queryByText('nav.pastors')).not.toBeInTheDocument()
    mockAuthData.user = saved
  })

  it('hides nav items for missing permissions', () => {
    renderLayout()
    expect(screen.queryByText('nav.pastors')).not.toBeInTheDocument()
    expect(screen.queryByText('nav.elders')).not.toBeInTheDocument()
    expect(screen.queryByText('nav.settings')).not.toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderLayout()
    expect(screen.getByText('auth.logout')).toBeInTheDocument()
  })

  it('renders user avatar with first letter', () => {
    renderLayout()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('opens sidebar on hamburger click', async () => {
    renderLayout()
    const hamburger = screen.getByLabelText('Menu')
    expect(hamburger).toBeInTheDocument()
    await userEvent.setup().click(hamburger)
    expect(document.querySelector('.layout')).toHaveClass('sidebar-open')
  })

  it('closes sidebar when overlay is clicked', async () => {
    renderLayout()
    const hamburger = screen.getByLabelText('Menu')
    await userEvent.setup().click(hamburger)
    const overlay = document.querySelector('.sidebar-overlay')
    if (overlay) {
      fireEvent.click(overlay)
      expect(document.querySelector('.layout')).not.toHaveClass('sidebar-open')
    }
  })

  it('renders search input', () => {
    renderLayout()
    expect(screen.getByPlaceholderText('common.search...')).toBeInTheDocument()
  })

  it('renders language select', () => {
    renderLayout()
    expect(screen.getByLabelText('Switch language')).toBeInTheDocument()
  })

  it('renders notification and profile links', () => {
    renderLayout()
    expect(screen.getByText('🔔')).toBeInTheDocument()
  })

  it('dashboard nav item has correct link', () => {
    renderLayout()
    const dashLinks = screen.getAllByText('nav.dashboard')
    const dashLink = dashLinks.find((el) => el.closest('a'))?.closest('a')
    expect(dashLink).toHaveAttribute('href', '/dashboard')
  })

  it('changes language via select', async () => {
    renderLayout()
    const select = screen.getByLabelText('Switch language')
    await userEvent.setup().selectOptions(select, 'fr')
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr')
  })

  it('renders profile link', () => {
    renderLayout()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('calls logout when sidebar footer logout is clicked', async () => {
    renderLayout()
    await userEvent.setup().click(screen.getByText('auth.logout'))
    expect(mockLogout).toHaveBeenCalled()
  })

  it('renders active NavLink when route matches', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Layout>Child content</Layout>
      </MemoryRouter>
    )
    const dashLinks = screen.getAllByText('nav.dashboard')
    const activeLink = dashLinks.find((el) => el.closest('a')?.classList.contains('active'))
    expect(activeLink).toBeTruthy()
  })

  it('renders fallback avatar when username is missing', () => {
    const saved = { ...mockAuthData.user }
    mockAuthData.user = { ...saved, username: '' }
    renderLayout()
    expect(screen.getByText('U')).toBeInTheDocument()
    mockAuthData.user = saved
  })
})
