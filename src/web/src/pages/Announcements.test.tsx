import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
const toastMock = { success: vi.fn(), error: vi.fn() }
vi.mock('react-hot-toast', () => ({ default: toastMock }))
const mockAuthUser = vi.fn(() => ({
  user: { username: 'admin', permissions: ['can_read_members', 'can_read_announcements', 'can_create_announcements', 'can_update_announcements', 'can_delete_announcements'], churchId: '1', roles: ['ADMIN'] },
  login: vi.fn(), logout: vi.fn(), loading: false,
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: (...args: any[]) => mockAuthUser(...args),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showConfirm: vi.fn().mockResolvedValue(true),
}))

const mockAnnMutate = vi.fn().mockResolvedValue(undefined)
const mockUpdateMut = vi.fn().mockResolvedValue(undefined)
const mockDeleteAnnMutate = vi.fn().mockResolvedValue(undefined)
const roles = [
  { id: '1', name: 'ADMIN', permissions: [] },
  { id: '2', name: 'PASTOR', permissions: [] },
  { id: '3', name: 'MEMBER', permissions: [] },
]
const announcements = [
  { id: 'a1', title: 'Sunday Service', content: 'Join us for Sunday service at 10am', priority: 'HIGH', expiresAt: '2024-01-20T10:00:00', rolesAllowed: ['ADMIN', 'PASTOR'] },
  { id: 'a2', title: 'Bible Study', content: 'Weekly Bible study every Wednesday at 6pm', priority: 'LOW', expiresAt: '', rolesAllowed: [] },
]

vi.mock('../hooks/useAnnouncements', () => ({
  useAnnouncementsList: vi.fn(() => ({ data: announcements, isLoading: false })),
  useCreateAnnouncement: vi.fn(() => ({ mutateAsync: mockAnnMutate, isPending: false })),
  useUpdateAnnouncement: vi.fn(() => ({ mutateAsync: mockUpdateMut, isPending: false })),
  useDeleteAnnouncement: vi.fn(() => ({ mutateAsync: mockDeleteAnnMutate, isPending: false })),
}))
vi.mock('../hooks/useRoles', () => ({
  useRolesList: vi.fn(() => ({ data: roles, isLoading: false })),
}))

import Announcements from './Announcements'
import { useAuth } from '../context/AuthContext'
import { useAnnouncementsList, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements'
import { useRolesList } from '../hooks/useRoles'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthUser.mockReturnValue({
  user: { username: 'admin', permissions: ['can_read_members', 'can_read_announcements', 'can_view_announcements', 'can_create_announcements', 'can_update_announcements', 'can_delete_announcements'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  })
  vi.mocked(useAnnouncementsList).mockReturnValue({ data: announcements, isLoading: false } as any)
  vi.mocked(useCreateAnnouncement).mockReturnValue({ mutateAsync: mockAnnMutate, isPending: false } as any)
  vi.mocked(useUpdateAnnouncement).mockReturnValue({ mutateAsync: mockUpdateMut, isPending: false } as any)
  vi.mocked(useDeleteAnnouncement).mockReturnValue({ mutateAsync: mockDeleteAnnMutate, isPending: false } as any)
  vi.mocked(useRolesList).mockReturnValue({ data: roles, isLoading: false } as any)
})

describe('Announcements', () => {
  it('renders announcements page', () => {
    render(<Announcements />)
    expect(screen.getByText('Announcements')).toBeInTheDocument()
    expect(screen.getByText('Manage church announcements')).toBeInTheDocument()
    expect(screen.getByText('Sunday Service')).toBeInTheDocument()
    expect(screen.getByText('Bible Study')).toBeInTheDocument()
  })

  it('does not render an events tab', () => {
    render(<Announcements />)
    expect(screen.queryByText('📅 Events')).not.toBeInTheDocument()
    expect(screen.queryByText('New Event')).not.toBeInTheDocument()
  })

  it('creates an announcement', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement
    await user.type(titleInput, 'New Announcement')
    const textarea = document.querySelector('textarea')
    if (textarea) await user.type(textarea, 'Content here')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(mockAnnMutate).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Announcement' }))
    })
    expect(showSuccessToast).toHaveBeenCalled()
  })

  it('shows error when title is empty on submit', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    fireEvent.submit(document.querySelector('form')!)
    expect(showErrorToast).toHaveBeenCalled()
  })

  it('edits an announcement', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    const editBtn = screen.getAllByLabelText('Edit')[0]
    await user.click(editBtn)
    expect(screen.getByText('Edit Announcement', { selector: 'h3' })).toBeInTheDocument()
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(mockUpdateMut).toHaveBeenCalled()
    })
  })

  it('closes form on cancel button', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    expect(screen.getByText('New Announcement', { selector: 'h3' })).toBeInTheDocument()
    await user.click(screen.getByText('common.cancel'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes form via close button', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    const dialog = document.querySelector('.announcement-dialog') as HTMLElement
    expect(within(dialog).getByLabelText('Close')).toBeInTheDocument()
    await user.click(within(dialog).getByLabelText('Close'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes form on Escape key', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    expect(screen.queryByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes form on overlay click', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    fireEvent.click(document.querySelector('.dialog-overlay')!)
    expect(screen.queryByText('New Announcement', { selector: 'h3' })).not.toBeInTheDocument()
  })

  it('handles create error', async () => {
    mockAnnMutate.mockRejectedValueOnce(new Error('Create failed'))
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement
    await user.type(titleInput, 'Fail')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Create failed')
    })
  })

  it('shows empty state when no announcements', () => {
    vi.mocked(useAnnouncementsList).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Announcements />)
    expect(screen.getByText('No announcements found')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(useAnnouncementsList).mockReturnValue({ data: undefined, isLoading: true } as any)
    const { container } = render(<Announcements />)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('announcement delete button calls showConfirm', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    const deleteBtns = screen.getAllByLabelText('Delete')
    await user.click(deleteBtns[0])
    const { showConfirm } = await import('../shared/utils/swal')
    expect(showConfirm).toHaveBeenCalled()
  })

  it('announcement create non-Error exception', async () => {
    mockAnnMutate.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement
    await user.type(titleInput, 'Fail')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Operation failed')
    })
  })

  it('announcement content truncation', () => {
    const longContent = 'x'.repeat(100)
    vi.mocked(useAnnouncementsList).mockReturnValue({
      data: [{ id: 'a1', title: 'Long', content: longContent, priority: 'LOW', expiresAt: '', rolesAllowed: [] }],
      isLoading: false,
    } as any)
    render(<Announcements />)
    expect(screen.getByText('Long')).toBeInTheDocument()
  })

  it('renders priority, expires, and roles fields in the form', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    const dialog = document.querySelector('.announcement-dialog') as HTMLElement
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Expires At')).toBeInTheDocument()
    expect(within(dialog).getByText('Visible to Roles')).toBeInTheDocument()
    const segBtns = Array.from(dialog.querySelectorAll('.seg-btn')).map((b) => b.textContent)
    expect(segBtns).toEqual(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    expect(dialog.querySelector('.seg-btn.active')?.textContent).toBe('LOW')
    const chips = Array.from(dialog.querySelectorAll('.role-chip')).map((c) => c.textContent)
    expect(chips).toEqual(['ADMIN', 'PASTOR', 'MEMBER'])
    expect(dialog.querySelector('input[type="datetime-local"]')).toBeInTheDocument()
  })

  it('sends priority, expiresAt, and rolesAllowed on create', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    const dialog = document.querySelector('.announcement-dialog') as HTMLElement
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement
    await user.type(titleInput, 'Priority Test')
    const textarea = dialog.querySelector('textarea')
    if (textarea) await user.type(textarea, 'Content')
    await user.click(within(dialog).getByRole('radio', { name: 'URGENT' }))
    const datetimeInput = dialog.querySelector('input[type="datetime-local"]') as HTMLInputElement
    await user.type(datetimeInput, '2024-12-25T10:00')
    await user.click(within(dialog).getByRole('button', { name: 'PASTOR' }))
    fireEvent.submit(dialog.querySelector('form')!)
    await waitFor(() => {
      expect(mockAnnMutate).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Priority Test',
        priority: 'URGENT',
        expiresAt: expect.stringContaining('2024-12-25T10:00'),
        rolesAllowed: expect.arrayContaining(['PASTOR']),
      }))
    })
    expect(showSuccessToast).toHaveBeenCalled()
  })

  it('populates priority, expiresAt, and rolesAllowed when editing', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    const editBtns = screen.getAllByLabelText('Edit')
    await user.click(editBtns[0])
    const dialog = document.querySelector('.announcement-dialog') as HTMLElement
    expect(dialog.querySelector('.seg-btn.active')?.textContent).toBe('HIGH')
    const activeChips = Array.from(dialog.querySelectorAll('.role-chip.active')).map((c) => c.textContent)
    expect(activeChips).toEqual(['ADMIN', 'PASTOR'])
  })

  it('announcement delete with confirm false', async () => {
    const { showConfirm } = await import('../shared/utils/swal')
    vi.mocked(showConfirm).mockResolvedValueOnce(false)
    const user = userEvent.setup()
    render(<Announcements />)
    const deleteBtns = screen.getAllByLabelText('Delete')
    await user.click(deleteBtns[0])
    await waitFor(() => { expect(showConfirm).toHaveBeenCalled() })
  })

  it('submit button shows loading when pending', async () => {
    vi.mocked(useCreateAnnouncement).mockReturnValue({ mutateAsync: mockAnnMutate, isPending: true } as any)
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getByText('New Announcement'))
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement
    await user.type(titleInput, 'Test')
    const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('hides CRUD buttons without announcement permissions', async () => {
    mockAuthUser.mockReturnValue({
      user: { username: 'user', permissions: ['can_read_announcements'], churchId: '1', roles: [] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<Announcements />)
    expect(screen.queryByText('New Announcement')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View')).not.toBeInTheDocument()
    expect(screen.queryAllByLabelText('Edit').length).toBe(0)
    expect(screen.queryAllByLabelText('Delete').length).toBe(0)
  })

  it('shows CRUD buttons with announcement permissions', () => {
    render(<Announcements />)
    expect(screen.getByText('New Announcement')).toBeInTheDocument()
    expect(screen.getAllByLabelText('View').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Edit').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Delete').length).toBeGreaterThan(0)
  })

  it('shows view button only when view permission is present', () => {
    mockAuthUser.mockReturnValue({
      user: { username: 'viewer', permissions: ['can_read_announcements', 'can_view_announcements'], churchId: '1', roles: [] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<Announcements />)
    expect(screen.getAllByLabelText('View').length).toBeGreaterThan(0)
    expect(screen.queryByText('New Announcement')).not.toBeInTheDocument()
    expect(screen.queryAllByLabelText('Edit').length).toBe(0)
    expect(screen.queryAllByLabelText('Delete').length).toBe(0)
  })

  it('opens the read-only view modal for a single announcement', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getAllByLabelText('View')[0])
    const dialog = document.querySelector('.announcement-dialog') as HTMLElement
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Sunday Service')).toBeInTheDocument()
    expect(within(dialog).getByText('Join us for Sunday service at 10am')).toBeInTheDocument()
    expect(within(dialog).getByText('HIGH')).toBeInTheDocument()
    expect(within(dialog).getByText('ADMIN')).toBeInTheDocument()
    expect(within(dialog).getByText('PASTOR')).toBeInTheDocument()
    expect(screen.queryByText('common.cancel')).not.toBeInTheDocument()
  })

  it('closes the view modal via close button', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    await user.click(screen.getAllByLabelText('View')[0])
    const dialog = document.querySelector('.announcement-dialog') as HTMLElement
    await user.click(within(dialog).getByLabelText('Close'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes an announcement when confirmed', async () => {
    const user = userEvent.setup()
    render(<Announcements />)
    const deleteBtns = screen.getAllByLabelText('Delete')
    await user.click(deleteBtns[0])
    await waitFor(() => {
      expect(mockDeleteAnnMutate).toHaveBeenCalledWith('a1')
      expect(showSuccessToast).toHaveBeenCalledWith('Announcement deleted')
    })
  })

  it('shows error when delete fails', async () => {
    mockDeleteAnnMutate.mockRejectedValueOnce(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<Announcements />)
    const deleteBtns = screen.getAllByLabelText('Delete')
    await user.click(deleteBtns[0])
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Delete failed')
    })
  })

  it('does not delete when confirm is declined', async () => {
    const { showConfirm } = await import('../shared/utils/swal')
    vi.mocked(showConfirm).mockResolvedValueOnce(false)
    const user = userEvent.setup()
    render(<Announcements />)
    const deleteBtns = screen.getAllByLabelText('Delete')
    await user.click(deleteBtns[0])
    await waitFor(() => { expect(showConfirm).toHaveBeenCalled() })
    expect(mockDeleteAnnMutate).not.toHaveBeenCalled()
  })
})
