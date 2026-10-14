import { render, screen, fireEvent } from '@testing-library/react'
import { Component, type ReactNode } from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

import ErrorBoundary from './ErrorBoundary'

class ThrowingComponent extends Component<{ shouldThrow?: boolean; errorMessage?: string }> {
  render() {
    if (this.props.shouldThrow) {
      throw new Error(this.props.errorMessage || 'Test error')
    }
    return <div>Child content</div>
  }
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children normally', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('shows error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow errorMessage="Boom" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Boom')).toBeInTheDocument()
  })

  it('shows custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error page</div>}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom error page')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('resets error state on "Try again" click', () => {
    let shouldThrow = true
    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Boom')
      return <div>Recovered</div>
    }
    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    shouldThrow = false
    fireEvent.click(screen.getByText('Try again'))
    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow errorMessage="Logged error" />
      </ErrorBoundary>
    )
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
