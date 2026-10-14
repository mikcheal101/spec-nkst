import { render, screen, fireEvent } from '@testing-library/react'

const mockChangeLanguage = vi.fn()
const { mockLanguage } = vi.hoisted(() => ({ mockLanguage: { value: 'en' } }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: mockLanguage.value, changeLanguage: mockChangeLanguage },
  }),
  Trans: ({ children }: any) => children,
}))

import LanguageSwitcher from './LanguageSwitcher'

beforeEach(() => {
  vi.clearAllMocks()
  mockLanguage.value = 'en'
})

describe('LanguageSwitcher', () => {
  it('renders current language', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('changes language on select', () => {
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'fr' } })
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr')
  })

  it('stores language in localStorage', () => {
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'tiv' } })
    expect(localStorage.getItem('i18nextLng')).toBe('tiv')
  })

  it('renders all language options', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Français' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Tiv' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Hausa' })).toBeInTheDocument()
  })

  it('falls back to English for an unknown language code', () => {
    mockLanguage.value = 'xx'
    render(<LanguageSwitcher />)
    expect(screen.getByText('EN')).toBeInTheDocument()
  })
})
