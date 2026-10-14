import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

import DataTable from './DataTable'

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
]

const data = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
]

describe('DataTable', () => {
  it('shows loading message', () => {
    render(<DataTable columns={columns} data={[]} loading />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('shows default empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('common.noData')).toBeInTheDocument()
  })

  it('shows custom empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('renders table rows with data', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('calls onRowClick when row clicked', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByText('Alice'))
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it('uses custom render function for columns', () => {
    const customColumns = [
      { key: 'name', header: 'Name', render: (item: any) => <strong>{item.name}</strong> },
    ]
    render(<DataTable columns={customColumns} data={data} />)
    expect(screen.getByText('Alice').tagName).toBe('STRONG')
  })

  it('adds clickable class when onRowClick provided', () => {
    const onRowClick = vi.fn()
    const { container } = render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />)
    const rows = container.querySelectorAll('tbody tr')
    rows.forEach((row) => expect(row).toHaveClass('clickable'))
  })

  it('does not add clickable class when no onRowClick', () => {
    const { container } = render(<DataTable columns={columns} data={data} />)
    const rows = container.querySelectorAll('tbody tr')
    rows.forEach((row) => expect(row).not.toHaveClass('clickable'))
  })

  it('renders null/undefined values as empty string', () => {
    const sparseData = [{ id: '1', name: 'Alice' }]
    render(<DataTable columns={columns} data={sparseData} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    const { container } = render(<DataTable columns={columns} data={sparseData} />)
    const cells = container.querySelectorAll('tbody td')
    expect(cells[1]).toHaveTextContent('')
  })
})
