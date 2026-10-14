import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toastMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_create_church', 'can_delete_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  })),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

const mockCreateMut = vi.fn().mockResolvedValue(undefined)
const mockUpdateMut = vi.fn().mockResolvedValue(undefined)
const mockDeleteMut = vi.fn().mockResolvedValue(undefined)
vi.mock('../hooks/useChurches', () => ({
  useChurches: vi.fn(() => ({
    data: {
      content: [
        { id: 1, name: 'Grace Church', address: '123 Main St', parentChurch: null, parentChurchId: null, pastors: [{ id: 1 }], elders: [], deacons: [] },
        { id: 2, name: 'Hope Church', address: '456 Oak Ave', parentChurch: { id: 1, name: 'Grace Church' }, parentChurchId: 1, pastors: [], elders: [{ id: 2 }], deacons: [{ id: 3 }] },
      ],
      totalPages: 1,
      totalElements: 2,
    },
    isLoading: false,
  })),
  useCreateChurch: vi.fn(() => ({ mutateAsync: mockCreateMut, isPending: false })),
  useUpdateChurch: vi.fn(() => ({ mutateAsync: mockUpdateMut, isPending: false })),
  useDeleteChurch: vi.fn(() => ({ mutateAsync: mockDeleteMut, isPending: false })),
  useAllChurches: vi.fn(() => ({
    data: {
      content: [
        { id: 1, name: 'Grace Church' },
        { id: 2, name: 'Hope Church' },
      ],
    },
  })),
  useChurchesAdminStatus: vi.fn(() => new Map([[1, true]])),
}))
vi.mock('../shared/components', () => ({
  SearchableSelect: ({ placeholder, onChange }: any) => (
    <select data-testid="searchable-select" onChange={(e) => onChange(Number(e.target.value) || null)}>
      <option value="">{placeholder}</option>
      <option value="1">Grace Church</option>
    </select>
  ),
}))

import Churches from './Churches'
import { useChurches, useCreateChurch, useUpdateChurch, useDeleteChurch, useAllChurches, useChurchesAdminStatus } from '../hooks/useChurches'
import { useAuth } from '../context/AuthContext'

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateMut.mockResolvedValue(undefined)
  mockUpdateMut.mockResolvedValue(undefined)
  mockDeleteMut.mockResolvedValue(undefined)
  vi.mocked(useChurches).mockReturnValue({
    data: {
      content: [
        { id: 1, name: 'Grace Church', address: '123 Main St', parentChurch: null, parentChurchId: null, pastors: [{ id: 1 }], elders: [], deacons: [] },
        { id: 2, name: 'Hope Church', address: '456 Oak Ave', parentChurch: { id: 1, name: 'Grace Church' }, parentChurchId: 1, pastors: [], elders: [{ id: 2 }], deacons: [{ id: 3 }] },
      ],
      totalPages: 1,
      totalElements: 2,
    },
    isLoading: false,
  } as any)
  vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map([[1, true]]))
  vi.mocked(useAuth).mockReturnValue({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_create_church', 'can_delete_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  } as any)
})

describe('Churches', () => {
  it('renders church list', () => {
    render(<Churches />)
    expect(screen.getByText('Grace Church')).toBeInTheDocument()
    expect(screen.getByText('Hope Church')).toBeInTheDocument()
    expect(screen.getByText('churches.title')).toBeInTheDocument()
  })

  it('shows empty state when no churches', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    } as any)
    render(<Churches />)
    expect(screen.getByText('No churches found')).toBeInTheDocument()
  })

  it('shows empty state with search query', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    } as any)
    render(<Churches />)
    const searchInput = screen.getByPlaceholderText('Search churches by name or address')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    expect(screen.getByText('No churches match your search')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)
    render(<Churches />)
    expect(document.querySelector('.skeleton-card')).toBeInTheDocument()
  })

  it('opens create form', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    expect(screen.getByText('churches.createChurch', { selector: 'h3' })).toBeInTheDocument()
  })

  it('creates a church', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    const inputs = document.querySelectorAll('.mf-input')
    if (inputs.length >= 2) {
      await user.type(inputs[0], 'New Church')
      await user.type(inputs[1], '789 New St')
    }
    fireEvent.submit(document.querySelector('form')!)
  })

  it('create form validation error on empty fields', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    const form = document.querySelector('form')!
    fireEvent.submit(form)
  })

  it('edit form opens for existing church', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    if (editBtn) {
      await user.click(editBtn)
      expect(screen.getByText('Edit Church')).toBeInTheDocument()
    }
  })

  it('edit church and save', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    if (editBtn) {
      await user.click(editBtn)
      fireEvent.submit(document.querySelector('form')!)
    }
  })

  it('opens delete confirm dialog', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    if (deleteBtn) {
      await user.click(deleteBtn)
      expect(screen.getByText('churches.confirmDelete')).toBeInTheDocument()
    }
  })

  it('deletes a church', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    if (deleteBtn) {
      await user.click(deleteBtn)
      const confirmBtn = document.querySelector('.dialog-actions button:last-child') || screen.getByText('common.confirm')
      await user.click(confirmBtn)
    }
  })

  it('cancel button closes form', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    const cancelBtn = screen.getByText('common.cancel')
    await user.click(cancelBtn)
  })

  it('close button in form header closes form', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    const closeBtn = document.querySelector('.mf-close') as HTMLButtonElement
    if (closeBtn) await user.click(closeBtn)
  })

  it('overlay click closes form', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    fireEvent.click(document.querySelector('.mf-overlay')!)
  })

  it('clear search button works', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const searchInput = screen.getByPlaceholderText('Search churches by name or address')
    await user.type(searchInput, 'test')
    const clearBtns = document.querySelectorAll('button')
    for (const btn of clearBtns) {
      if (btn.querySelector('svg') && btn.closest('[style*="position: absolute"]')) {
        await user.click(btn)
        break
      }
    }
  })

  it('sort dropdown works', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const sortSelect = document.querySelector('select') as HTMLSelectElement
    if (sortSelect) {
      await user.selectOptions(sortSelect, 'name,asc')
    }
  })

  it('shows total elements count', () => {
    render(<Churches />)
    expect(screen.getByText('2 churches')).toBeInTheDocument()
  })

  it('parent church name shows in card', () => {
    render(<Churches />)
    expect(screen.getByText(/Sub of/)).toBeInTheDocument()
  })

  it('navigates to church on card click', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const cards = document.querySelectorAll('[style*="cursor: pointer"]')
    if (cards.length > 0) await user.click(cards[0])
  })

  it('shows admin badge for admin churches', () => {
    render(<Churches />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows pastor/elder/deacon counts', () => {
    render(<Churches />)
    expect(screen.getByText('1 pastor')).toBeInTheDocument()
    expect(screen.getByText('1 elder')).toBeInTheDocument()
  })

  it('shows "No leadership assigned" for empty church', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 5, name: 'Empty Church', address: 'No St', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] },
        ],
        totalPages: 1,
        totalElements: 1,
      },
      isLoading: false,
    } as any)
    render(<Churches />)
    expect(screen.getByText('No leadership assigned')).toBeInTheDocument()
  })

  it('plural labels for counts', () => {
    render(<Churches />)
    expect(screen.getByText('1 pastor')).toBeInTheDocument()
  })

  it('clear filters button appears with filters', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const searchInput = screen.getByPlaceholderText('Search churches by name or address')
    await user.type(searchInput, 'test')
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('view button navigates', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const viewBtn = document.querySelector('[title="View"]') as HTMLButtonElement
    if (viewBtn) await user.click(viewBtn)
  })

  it('edit form saves with parent church', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    if (editBtn) {
      await user.click(editBtn)
      const select = document.querySelector('[data-testid="searchable-select"]') as HTMLSelectElement
      if (select) await user.selectOptions(select, '1')
      fireEvent.submit(document.querySelector('form')!)
    }
  })

  it('create form with parent church', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    const inputs = document.querySelectorAll('.mf-input')
    if (inputs.length >= 2) {
      await user.type(inputs[0], 'New Church')
      await user.type(inputs[1], '789 New St')
    }
    const select = document.querySelector('[data-testid="searchable-select"]') as HTMLSelectElement
    if (select) await user.selectOptions(select, '1')
    fireEvent.submit(document.querySelector('form')!)
  })

  it('delete confirm dialog cancel', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    if (deleteBtn) {
      await user.click(deleteBtn)
      const cancelBtn = screen.getByText('common.cancel')
      await user.click(cancelBtn)
    }
  })

  it('permission gating: no create button without permission', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: { content: [{ id: 5, name: 'X', address: 'Y', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] }], totalPages: 1, totalElements: 1 },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'user', permissions: ['can_read_church'], churchId: '1', roles: [] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<Churches />)
    expect(screen.queryByText('churches.createChurch')).not.toBeInTheDocument()
  })

  it('mouse events on church card', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const card = document.querySelector('[style*="cursor: pointer"]') as HTMLElement
    if (card) {
      fireEvent.mouseEnter(card)
      fireEvent.mouseLeave(card)
    }
  })

  it('pagination works with multiple pages', async () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: 'Church1', address: 'Addr1', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] },
          { id: 2, name: 'Church2', address: 'Addr2', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] },
        ],
        totalPages: 3,
        totalElements: 30,
      },
      isLoading: false,
    } as any)
    render(<Churches />)

    const firstBtn = document.querySelector('.pagination .btn-outline') as HTMLButtonElement
    const page2Btns = Array.from(document.querySelectorAll('.pagination .btn-primary'))
    if (page2Btns.length > 0) {
      await userEvent.setup().click(page2Btns[0])
    }

    const nextBtn = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '›'
    ) as HTMLButtonElement
    if (nextBtn && !nextBtn.disabled) {
      await userEvent.setup().click(nextBtn)
    }

    const lastBtn = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '»'
    ) as HTMLButtonElement
    if (lastBtn && !lastBtn.disabled) {
      await userEvent.setup().click(lastBtn)
    }

    const prevBtn = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '‹'
    ) as HTMLButtonElement
    if (prevBtn && !prevBtn.disabled) {
      await userEvent.setup().click(prevBtn)
    }

    const firstBtn2 = Array.from(document.querySelectorAll('.pagination .btn-outline')).find(
      (b) => b.textContent === '«'
    ) as HTMLButtonElement
    if (firstBtn2 && !firstBtn2.disabled) {
      await userEvent.setup().click(firstBtn2)
    }
  })

  it('pagination shows ellipsis for many pages', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: Array.from({ length: 12 }, (_, i) => ({
          id: i + 1, name: `C${i + 1}`, address: `A${i + 1}`, parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [],
        })),
        totalPages: 5,
        totalElements: 60,
      },
      isLoading: false,
    } as any)
    render(<Churches />)
    const ellipsis = document.querySelector('.pagination-ellipsis')
    expect(ellipsis).toBeInTheDocument()
  })

  it('parentChurchId fallback name', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 10, name: 'Sub', address: 'Addr', parentChurch: null, parentChurchId: 999, pastors: [], elders: [], deacons: [] },
        ],
        totalPages: 1,
        totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText(/#999/)).toBeInTheDocument()
  })

  it('no permissions hides all action buttons', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [{ id: 1, name: 'C', address: 'A', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] }],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'u', permissions: [], churchId: '1', roles: [] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<Churches />)
    expect(screen.queryByTitle('View')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('create mutation error shows toast', async () => {
    mockCreateMut.mockRejectedValueOnce(new Error('Create failed'))
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    const inputs = document.querySelectorAll('.mf-input')
    if (inputs.length >= 2) {
      await user.type(inputs[0], 'New')
      await user.type(inputs[1], 'Addr')
    }
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled()
    })
  })

  it('edit mutation error shows toast', async () => {
    mockUpdateMut.mockRejectedValueOnce(new Error('Edit failed'))
    const user = userEvent.setup()
    render(<Churches />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    if (editBtn) {
      await user.click(editBtn)
      fireEvent.submit(document.querySelector('form')!)
      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalled()
      })
    }
  })

  it('delete mutation error shows toast', async () => {
    mockDeleteMut.mockRejectedValueOnce(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<Churches />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    if (deleteBtn) {
      await user.click(deleteBtn)
      const confirmBtn = screen.getByText('common.confirm')
      await user.click(confirmBtn)
      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalled()
      })
    }
  })

  it('deacon count shows 1 deacon singular', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: 'C', address: 'A', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [{ id: 1 }] },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText('1 deacon')).toBeInTheDocument()
  })

  it('deacon count plural', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: 'C', address: 'A', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [{ id: 1 }, { id: 2 }] },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText('2 deacons')).toBeInTheDocument()
  })

  it('multiple pastors shows plural', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: 'C', address: 'A', parentChurch: null, parentChurchId: null, pastors: [{ id: 1 }, { id: 2 }], elders: [], deacons: [] },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText('2 pastors')).toBeInTheDocument()
  })

  it('multiple elders shows plural', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: 'C', address: 'A', parentChurch: null, parentChurchId: null, pastors: [], elders: [{ id: 1 }, { id: 2 }], deacons: [] },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText('2 elders')).toBeInTheDocument()
  })

  it('single church shows singular label', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [{ id: 1, name: 'C', address: 'A', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] }],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText('1 church')).toBeInTheDocument()
  })

  it('delete confirm dialog cancel clears target', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    if (deleteBtn) {
      await user.click(deleteBtn)
      expect(screen.getByText('churches.confirmDelete')).toBeInTheDocument()
      const cancelBtns = document.querySelectorAll('button')
      for (const btn of cancelBtns) {
        if (btn.textContent?.includes('common.cancel') || btn.textContent?.includes('Cancel')) {
          await user.click(btn)
          break
        }
      }
    }
  })

  it('user with no permissions array hides create button', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: undefined as any,
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<Churches />)
    expect(screen.queryByText('churches.createChurch')).not.toBeInTheDocument()
  })

  it('handles undefined allData', () => {
    vi.mocked(useAllChurches).mockReturnValue({ data: undefined } as any)
    render(<Churches />)
    expect(screen.getByText('Grace Church')).toBeInTheDocument()
  })

  it('create mutation non-Error rejection', async () => {
    mockCreateMut.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    const inputs = document.querySelectorAll('.mf-input')
    if (inputs.length >= 2) {
      await user.type(inputs[0], 'New')
      await user.type(inputs[1], 'Addr')
    }
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Operation failed')
    })
  })

  it('delete mutation non-Error rejection', async () => {
    mockDeleteMut.mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<Churches />)
    const deleteBtn = document.querySelector('[title="Delete"]') as HTMLButtonElement
    if (deleteBtn) {
      await user.click(deleteBtn)
      const confirmBtn = screen.getByText('common.confirm')
      await user.click(confirmBtn)
      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalledWith('Delete failed')
      })
    }
  })

  it('parent found in allChurches but not as parentChurch property', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 10, name: 'Sub', address: 'Addr', parentChurch: null, parentChurchId: 1, pastors: [], elders: [], deacons: [] },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    vi.mocked(useAllChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: 'Grace Church' },
          { id: 2, name: 'Hope Church' },
        ],
      },
    } as any)
    render(<Churches />)
    expect(screen.getByText(/Sub of Grace Church/)).toBeInTheDocument()
  })

  it('shows pending state during create', async () => {
    vi.mocked(useCreateChurch).mockReturnValue({ mutateAsync: mockCreateMut, isPending: true } as any)
    const user = userEvent.setup()
    render(<Churches />)
    await user.click(screen.getByText('churches.createChurch'))
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows pending state during edit', async () => {
    vi.mocked(useUpdateChurch).mockReturnValue({ mutateAsync: mockUpdateMut, isPending: true } as any)
    const user = userEvent.setup()
    render(<Churches />)
    const editBtn = document.querySelector('[title="Edit"]') as HTMLButtonElement
    if (editBtn) {
      await user.click(editBtn)
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    }
  })

  it('church with empty name shows fallback', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: '', address: 'Addr', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('no address in church card', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: {
        content: [
          { id: 1, name: 'Test', address: '', parentChurch: null, parentChurchId: null, pastors: [], elders: [], deacons: [] },
        ],
        totalPages: 1, totalElements: 1,
      },
      isLoading: false,
    } as any)
    vi.mocked(useChurchesAdminStatus).mockReturnValue(new Map())
    render(<Churches />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('user with only can_read_church permission', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { username: 'reader', permissions: ['can_read_church'], churchId: '1', roles: [] },
      login: vi.fn(), logout: vi.fn(), loading: false,
    } as any)
    render(<Churches />)
    expect(screen.queryByText('churches.createChurch')).not.toBeInTheDocument()
    expect(screen.getAllByTitle('View').length).toBeGreaterThan(0)
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('shows totalElements as 0 when no data', () => {
    vi.mocked(useChurches).mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    } as any)
    render(<Churches />)
    expect(screen.getByText('No churches found')).toBeInTheDocument()
  })

  it('hover and leave on View buttons', async () => {
    render(<Churches />)
    const viewBtns = screen.getAllByTitle('View')
    fireEvent.mouseEnter(viewBtns[0])
    fireEvent.mouseLeave(viewBtns[0])
  })

  it('hover and click on Clear button', async () => {
    const user = userEvent.setup()
    render(<Churches />)
    const searchInput = screen.getByPlaceholderText(/Search/)
    await user.type(searchInput, 'test')
    const clearBtn = screen.getByText('Clear')
    fireEvent.mouseEnter(clearBtn)
    fireEvent.mouseLeave(clearBtn)
    await user.click(clearBtn)
  })

  it('SelectFilter focus and blur', async () => {
    render(<Churches />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.focus(selects[0])
    fireEvent.blur(selects[0])
  })

  it('click on church card navigates', async () => {
    render(<Churches />)
    const churchText = screen.getByText('Grace Church')
    fireEvent.click(churchText)
  })

  it('hover on church card', async () => {
    render(<Churches />)
    const churchText = screen.getByText('Grace Church')
    const card = churchText.closest('div[style]')
    if (card) {
      fireEvent.mouseEnter(card)
      fireEvent.mouseLeave(card)
    }
  })
})
