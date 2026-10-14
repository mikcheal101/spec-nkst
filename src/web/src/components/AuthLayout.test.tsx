import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
}))

import AuthLayout from './AuthLayout'

describe('AuthLayout', () => {
  it('renders brand name', () => {
    render(<AuthLayout title="Sign In"><div /></AuthLayout>)
    expect(screen.getByText('NKST')).toBeInTheDocument()
  })

  it('renders brand subtitle', () => {
    render(<AuthLayout title="Sign In"><div /></AuthLayout>)
    expect(screen.getByText('Nongo u Kristu u ken Sudan hen Tiv')).toBeInTheDocument()
  })

  it('renders the title prop', () => {
    render(<AuthLayout title="Sign In"><div /></AuthLayout>)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <AuthLayout title="Sign In">
        <p>Form content</p>
      </AuthLayout>
    )
    expect(screen.getByText('Form content')).toBeInTheDocument()
  })

  it('renders the subtitle from translation', () => {
    render(<AuthLayout title="Login"><div /></AuthLayout>)
    expect(screen.getByText('app.subtitle')).toBeInTheDocument()
  })

  it('renders auth layout structure', () => {
    const { container } = render(<AuthLayout title="Login"><div /></AuthLayout>)
    expect(container.querySelector('.auth-page')).toBeInTheDocument()
    expect(container.querySelector('.auth-card')).toBeInTheDocument()
    expect(container.querySelector('.auth-header')).toBeInTheDocument()
  })

  it('renders auth cross element', () => {
    const { container } = render(<AuthLayout title="Login"><div /></AuthLayout>)
    expect(container.querySelector('.auth-cross')).toBeInTheDocument()
  })
})
