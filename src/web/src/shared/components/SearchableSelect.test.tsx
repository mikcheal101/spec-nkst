import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

import SearchableSelect from './SearchableSelect'

const options = [
  { id: 1, label: 'Apple' },
  { id: 2, label: 'Banana' },
  { id: 3, label: 'Cherry' },
]

const defaultProps = {
  options,
  value: null as number | null,
  onChange: vi.fn(),
  placeholder: 'Select fruit...',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SearchableSelect', () => {
  it('shows placeholder when no value', () => {
    render(<SearchableSelect {...defaultProps} />)
    expect(screen.getByPlaceholderText('Select fruit...')).toHaveValue('')
  })

  it('shows selected label when value set', () => {
    render(<SearchableSelect {...defaultProps} value={2} />)
    expect(screen.getByDisplayValue('Banana')).toBeInTheDocument()
  })

  it('opens dropdown on focus', () => {
    render(<SearchableSelect {...defaultProps} />)
    fireEvent.focus(screen.getByPlaceholderText('Select fruit...'))
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Cherry')).toBeInTheDocument()
  })

  it('filters options by search text', async () => {
    const user = userEvent.setup()
    render(<SearchableSelect {...defaultProps} />)
    const input = screen.getByPlaceholderText('Select fruit...')
    await user.click(input)
    await user.type(input, 'an')
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
    expect(screen.queryByText('Cherry')).not.toBeInTheDocument()
  })

  it('calls onChange when option selected', () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...defaultProps} onChange={onChange} />)
    fireEvent.focus(screen.getByPlaceholderText('Select fruit...'))
    fireEvent.click(screen.getByText('Cherry'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('clears value when clear button clicked', () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...defaultProps} value={1} onChange={onChange} />)
    fireEvent.click(screen.getByText('×'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('closes dropdown on Escape', () => {
    render(<SearchableSelect {...defaultProps} />)
    const input = screen.getByPlaceholderText('Select fruit...')
    fireEvent.focus(input)
    expect(screen.getByText('Apple')).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
  })

  it('selects first filtered option on Enter', () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...defaultProps} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Select fruit...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Ch' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('shows "No results" when no matches', () => {
    render(<SearchableSelect {...defaultProps} />)
    const input = screen.getByPlaceholderText('Select fruit...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'xyz' } })
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('respects excludeIds', () => {
    render(<SearchableSelect {...defaultProps} excludeIds={new Set([2])} />)
    fireEvent.focus(screen.getByPlaceholderText('Select fruit...'))
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.queryByText('Banana')).not.toBeInTheDocument()
    expect(screen.getByText('Cherry')).toBeInTheDocument()
  })

  it('shows all options when no search and no excludeIds', () => {
    render(<SearchableSelect {...defaultProps} />)
    fireEvent.focus(screen.getByPlaceholderText('Select fruit...'))
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Cherry')).toBeInTheDocument()
  })

  it('highlights selected option in dropdown', () => {
    render(<SearchableSelect {...defaultProps} value={2} />)
    fireEvent.focus(screen.getByPlaceholderText('Select fruit...'))
    const bananaOption = screen.getByText('Banana').closest('.searchable-select-option')
    expect(bananaOption).toHaveClass('selected')
  })

  it('closes dropdown when clicking outside', () => {
    render(
      <div data-testid="outside">
        <SearchableSelect {...defaultProps} />
      </div>
    )
    const input = screen.getByPlaceholderText('Select fruit...')
    fireEvent.focus(input)
    expect(screen.getByText('Apple')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
  })

  it('prevents default on option mouseDown', () => {
    render(<SearchableSelect {...defaultProps} />)
    fireEvent.focus(screen.getByPlaceholderText('Select fruit...'))
    const option = screen.getByText('Apple')
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    option.dispatchEvent(event)
    expect(preventDefaultSpy).toHaveBeenCalled()
    preventDefaultSpy.mockRestore()
  })

  it('closes dropdown and clears search after selection', () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...defaultProps} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Select fruit...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'An' } })
    fireEvent.click(screen.getByText('Banana'))
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
    expect(input).toHaveValue('')
  })
})
