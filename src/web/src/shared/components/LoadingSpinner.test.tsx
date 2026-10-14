import { render } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('.loading-spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveStyle({ width: '24px', height: '24px' })
  })

  it('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size={48} />)
    const spinner = container.querySelector('.loading-spinner')
    expect(spinner).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('contains inner spinner div', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('.spinner')).toBeInTheDocument()
  })
})
