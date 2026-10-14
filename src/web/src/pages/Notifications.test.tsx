import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
}))
vi.mock('../hooks/useNotifications', () => ({
  useNotificationTemplates: vi.fn(),
}))

import Notifications from './Notifications'
import { useNotificationTemplates } from '../hooks/useNotifications'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Notifications', () => {
  it('shows loading state', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<Notifications />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Notifications />)
    expect(screen.getByText('notifications.noNotifications')).toBeInTheDocument()
  })

  it('renders notification list', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({
      data: [
        { id: '1', title: 'New Announcement', message: 'Service on Sunday', read: false, type: 'info', createdAt: '2024-01-15T10:00:00Z' },
        { id: '2', title: 'Meeting Reminder', message: 'Board meeting at 3pm', read: true, type: 'warning', createdAt: '2024-01-14T08:00:00Z' },
      ],
      isLoading: false,
    } as any)
    render(<Notifications />)
    expect(screen.getByText('New Announcement')).toBeInTheDocument()
    expect(screen.getByText('Meeting Reminder')).toBeInTheDocument()
    expect(screen.getByText('Service on Sunday')).toBeInTheDocument()
    expect(screen.getByText('Board meeting at 3pm')).toBeInTheDocument()
  })

  it('shows mark-all-read button when there are unread notifications', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({
      data: [
        { id: '1', title: 'Unread', message: 'msg', read: false, type: 'info', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    render(<Notifications />)
    expect(screen.getByText('notifications.markAllRead')).toBeInTheDocument()
  })

  it('hides mark-all-read button when all notifications are read', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({
      data: [
        { id: '1', title: 'Read notification', message: 'msg', read: true, type: 'info', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    render(<Notifications />)
    expect(screen.queryByText('notifications.markAllRead')).not.toBeInTheDocument()
  })

  it('applies unread styling to unread notifications', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({
      data: [
        { id: '1', title: 'Unread Item', message: 'msg', read: false, type: 'info', createdAt: '2024-01-15T10:00:00Z' },
        { id: '2', title: 'Read Item', message: 'msg', read: true, type: 'info', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const { container } = render(<Notifications />)
    const items = container.querySelectorAll('.notification-item')
    expect(items[0]).toHaveClass('unread')
    expect(items[1]).not.toHaveClass('unread')
  })

  it('shows notification dot for unread items', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({
      data: [
        { id: '1', title: 'Unread', message: 'msg', read: false, type: 'info', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const { container } = render(<Notifications />)
    expect(container.querySelector('.notification-dot')).toBeInTheDocument()
  })

  it('hides notification dot for read items', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({
      data: [
        { id: '1', title: 'Read', message: 'msg', read: true, type: 'info', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const { container } = render(<Notifications />)
    expect(container.querySelector('.notification-dot')).not.toBeInTheDocument()
  })

  it('handles non-array data gracefully', () => {
    vi.mocked(useNotificationTemplates).mockReturnValue({ data: null, isLoading: false } as any)
    render(<Notifications />)
    expect(screen.getByText('notifications.noNotifications')).toBeInTheDocument()
  })
})
