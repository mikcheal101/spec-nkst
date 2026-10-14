import { render } from '@testing-library/react'
import Skeleton from './Skeleton'

describe('Skeleton', () => {
  it('renders basic skeleton', () => {
    const { container } = render(<Skeleton width={100} height={20} />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveClass('skeleton')
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('20px')
  })

  it('renders with string width', () => {
    const { container } = render(<Skeleton width="80%" />)
    expect((container.firstChild as HTMLElement).style.width).toBe('80%')
  })

  it('renders Circle', () => {
    const { container } = render(<Skeleton.Circle size={40} />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveClass('skeleton', 'skeleton-circle')
    expect(el.style.width).toBe('40px')
    expect(el.style.height).toBe('40px')
    expect(el.style.borderRadius).toBe('50%')
  })

  it('renders Card', () => {
    const { container } = render(<Skeleton.Card rows={4} />)
    const card = container.querySelector('.skeleton-card')
    expect(card).toBeInTheDocument()
    expect(card!.querySelectorAll('.skeleton')).toHaveLength(4)
  })

  it('renders Table', () => {
    const { container } = render(<Skeleton.Table rows={3} cols={5} />)
    const table = container.querySelector('.skeleton-table')
    expect(table).toBeInTheDocument()
    expect(table!.querySelectorAll('thead th')).toHaveLength(5)
    expect(table!.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(table!.querySelectorAll('tbody td')).toHaveLength(15)
  })

  it('renders with default props', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el.style.height).toBe('14px')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom" />)
    expect((container.firstChild as HTMLElement).className).toContain('custom')
  })
})
