import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

import ConfirmDialog from './ConfirmDialog'

const defaultProps = {
  open: true,
  title: 'Are you sure?',
  message: 'This action cannot be undone.',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ConfirmDialog', () => {
  it('returns null when open is false', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows title and message', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('common.confirm'))
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('common.cancel'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when overlay clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('Are you sure?').closest('.dialog-overlay')!)
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel when dialog body clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('Are you sure?').closest('.dialog')!)
    expect(defaultProps.onCancel).not.toHaveBeenCalled()
  })

  it('shows loading state', () => {
    render(<ConfirmDialog {...defaultProps} loading />)
    expect(screen.getByText('common.confirm...')).toBeInTheDocument()
    expect(screen.getByText('common.cancel')).toBeDisabled()
    expect(screen.getByText('common.confirm...')).toBeDisabled()
  })

  it('uses danger class when danger prop', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} danger />)
    const confirmBtn = container.querySelector('.btn-danger')
    expect(confirmBtn).toBeInTheDocument()
    expect(confirmBtn).toHaveTextContent('common.confirm')
  })

  it('uses primary class when not danger', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />)
    const confirmBtn = container.querySelector('.btn-primary')
    expect(confirmBtn).toBeInTheDocument()
    expect(confirmBtn).toHaveTextContent('common.confirm')
  })

  it('shows custom labels', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Yes, delete" cancelLabel="No, keep" />)
    expect(screen.getByText('Yes, delete')).toBeInTheDocument()
    expect(screen.getByText('No, keep')).toBeInTheDocument()
  })
})
