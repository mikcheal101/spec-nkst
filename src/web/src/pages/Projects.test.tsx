import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
}))
vi.mock('../shared/utils/swal', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}))
vi.mock('../hooks/useWorkflows', () => ({
  usePendingTasks: vi.fn(),
  useTakeAction: vi.fn(),
}))

import Projects from './Projects'
import { usePendingTasks, useTakeAction } from '../hooks/useWorkflows'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useTakeAction).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
})

describe('Projects', () => {
  it('shows loading state on pending tab', () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<Projects />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('renders pending tab by default', () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Projects />)
    expect(screen.getByText('⏳ Pending Approval')).toHaveClass('active')
    expect(screen.getByText('📋 All Projects')).not.toHaveClass('active')
  })

  it('renders pending tasks data', () => {
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    render(<Projects />)
    expect(screen.getByText('CONTRIBUTION PROJECT')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('shows empty message when no pending tasks', () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Projects />)
    expect(screen.getByText('No pending approval tasks')).toBeInTheDocument()
  })

  it('switches to all projects tab', async () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: [], isLoading: false } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('📋 All Projects'))
    expect(screen.getByText('📋 All Projects')).toHaveClass('active')
    expect(screen.getByText('wf-1')).toBeInTheDocument()
  })

  it('switches back to pending tab', async () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: [], isLoading: false } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('📋 All Projects'))
    await user.click(screen.getByText('⏳ Pending Approval'))
    expect(screen.getByText('⏳ Pending Approval')).toHaveClass('active')
  })

  it('approves a pending task', async () => {
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Projects />)
    const approveBtn = screen.getByText('✓ Approve')
    await user.click(approveBtn)
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ stepId: 's1', data: { action: 'APPROVE', comments: '' } })
      expect(showSuccessToast).toHaveBeenCalledWith('Step approved')
    })
  })

  it('rejects a pending task', async () => {
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Projects />)
    const rejectBtn = screen.getByText('✗ Reject')
    await user.click(rejectBtn)
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ stepId: 's1', data: { action: 'REJECT', comments: '' } })
      expect(showSuccessToast).toHaveBeenCalledWith('Step rejected')
    })
  })

  it('shows error on approve failure', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Action failed'))
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('✓ Approve'))
    await vi.waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Action failed')
    })
  })

  it('shows error on reject failure', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Reject failed'))
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('✗ Reject'))
    await vi.waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Reject failed')
    })
  })

  it('disables action buttons while pending', () => {
    vi.mocked(useTakeAction).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    render(<Projects />)
    expect(screen.getByText('✓ Approve')).toBeDisabled()
    expect(screen.getByText('✗ Reject')).toBeDisabled()
  })

  it('renders hardcoded workflow data on all projects tab', async () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: [], isLoading: false } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('📋 All Projects'))
    expect(screen.getByText('wf-1')).toBeInTheDocument()
    expect(screen.getByText('wf-2')).toBeInTheDocument()
    expect(screen.getByText('wf-3')).toBeInTheDocument()
  })

  it('shows error on approve failure with non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('string error')
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('✓ Approve'))
    await vi.waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Action failed')
    })
  })

  it('shows error on reject failure with non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('string error')
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('✗ Reject'))
    await vi.waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Action failed')
    })
  })

  it('handles pendingData as object with content property', () => {
    vi.mocked(usePendingTasks).mockReturnValue({
      data: { content: [
        { stepId: 's2', workflowId: 'w2', requestType: 'EVENT_BOOKING', resourceId: 'r2', stepName: 'Approval', createdAt: '2024-02-10T12:00:00Z' },
      ] },
      isLoading: false,
    } as any)
    render(<Projects />)
    expect(screen.getByText('EVENT BOOKING')).toBeInTheDocument()
  })

  it('renders all projects tab showing badge for all status types', async () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: [], isLoading: false } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('📋 All Projects'))
    expect(screen.getByText('APPROVED')).toBeInTheDocument()
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument()
  })

  it('renders date column for pending tasks', () => {
    vi.mocked(usePendingTasks).mockReturnValue({
      data: [
        { stepId: 's1', workflowId: 'w1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'r1', stepName: 'Review', createdAt: '2024-01-15T10:00:00Z' },
      ],
      isLoading: false,
    } as any)
    render(<Projects />)
    expect(screen.getByText('1/15/2024')).toBeInTheDocument()
  })

  it('renders date column for all projects', async () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: [], isLoading: false } as any)
    const user = userEvent.setup()
    render(<Projects />)
    await user.click(screen.getByText('📋 All Projects'))
    const today = new Date().toLocaleDateString()
    expect(screen.getAllByText(today).length).toBeGreaterThanOrEqual(1)
  })
})
