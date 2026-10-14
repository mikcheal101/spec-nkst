import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
const mockLocation = { pathname: '/members/1' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }), useLocation: () => mockLocation, useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', permissions: ['can_read_members', 'can_update_members', 'can_create_members', 'can_delete_members', 'can_read_church', 'can_update_church', 'can_read_pastor', 'can_read_elders', 'can_read_deacons', 'can_update_deacons', 'can_delete_deacons', 'can_read_settings'], churchId: '1', roles: ['ADMIN'] },
    login: vi.fn(), logout: vi.fn(), loading: false,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
vi.mock('../hooks/usePeople', () => ({
  usePerson: vi.fn(),
  useDeacon: vi.fn(),
  useElder: vi.fn(),
  useUpdatePerson: vi.fn(),
  useUpdateDeacon: vi.fn(),
  useUpdateElder: vi.fn(),
  useDeletePerson: vi.fn(),
  useDeleteDeacon: vi.fn(),
  useDeleteElder: vi.fn(),
  useMakeChurchAdmin: vi.fn(),
}))
vi.mock('../hooks/useChurches', () => ({
  useAllChurches: vi.fn(() => ({
    data: { content: [{ id: 1, name: 'Grace Church' }] },
  })),
}))

import PersonDetail from './PersonDetail'
import { usePerson, useDeacon, useElder, useUpdatePerson, useUpdateDeacon, useUpdateElder, useDeletePerson, useDeleteDeacon, useDeleteElder, useMakeChurchAdmin } from '../hooks/usePeople'

const defaultPersonData = {
  id: 1, firstName: 'John', lastName: 'Doe', middleName: 'M', gender: 'Male',
  emailAddress: 'john@test.com', tel: '1234567', dateOfBirth: '1990-01-15', address: '123 St',
  baptised: true, isBaptised: true, admin: false, position: 'Member',
  church: { id: 1, name: 'Grace Church', address: '456 Church St' },
  baptismRecord: { serialNumber: 101, dateOfBaptism: '2015-06-20', worshipCenter: 'Main Hall', baptizedBy: 'Pastor James', bibleVerse: 'John 3:16', remark: 'First baptism' },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockNavigate.mockClear()
  mockLocation.pathname = '/members/1'
  mockMutateAsync.mockReset().mockResolvedValue(undefined)
  vi.mocked(usePerson).mockReturnValue({ data: defaultPersonData, isLoading: false } as any)
  vi.mocked(useDeacon).mockReturnValue({ data: undefined, isLoading: false } as any)
  vi.mocked(useElder).mockReturnValue({ data: undefined, isLoading: false } as any)
  vi.mocked(useUpdatePerson).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useUpdateDeacon).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useUpdateElder).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useDeletePerson).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useDeleteDeacon).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useDeleteElder).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
  vi.mocked(useMakeChurchAdmin).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any)
})

describe('PersonDetail', () => {
  it('renders person details', () => {
    render(<PersonDetail />)
    expect(screen.getAllByText('John M Doe').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Grace Church').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1234567').length).toBeGreaterThan(0)
    expect(screen.getAllByText('john@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Male').length).toBeGreaterThan(0)
  })

  it('shows loading state', () => {
    vi.mocked(usePerson).mockReturnValue({ data: undefined, isLoading: true } as any)
    render(<PersonDetail />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('shows not found when person is null', () => {
    vi.mocked(usePerson).mockReturnValue({ data: null, isLoading: false } as any)
    render(<PersonDetail />)
    expect(screen.getByText('Member not found')).toBeInTheDocument()
    expect(screen.getByText('Back to Members')).toBeInTheDocument()
  })

  it('navigates back from not found state', async () => {
    vi.mocked(usePerson).mockReturnValue({ data: null, isLoading: false } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Back to Members'))
    expect(mockNavigate).toHaveBeenCalledWith('/members')
  })

  it('navigates back via breadcrumb', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Members'))
    expect(mockNavigate).toHaveBeenCalledWith('/members')
  })

  it('opens edit form', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Member')).toBeInTheDocument()
  })

  it('closes edit form via cancel', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    const cancelBtn = screen.getByText('Cancel')
    await user.click(cancelBtn)
    expect(screen.queryByText('Edit Member')).not.toBeInTheDocument()
  })

  it('closes edit form via overlay click', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.click(document.querySelector('.mf-overlay')!)
    expect(screen.queryByText('Edit Member')).not.toBeInTheDocument()
  })

  it('closes edit form via close button', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    const closeBtn = document.querySelector('.mf-close')!
    await user.click(closeBtn)
    expect(screen.queryByText('Edit Member')).not.toBeInTheDocument()
  })

  it('submits edit form successfully', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
  })

  it('handles edit form error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Update failed'))
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Update failed'))
  })

  it('handles edit form non-Error exception', async () => {
    mockMutateAsync.mockRejectedValueOnce('string err')
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update member'))
  })

  it('opens delete confirm dialog', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Delete'))
    expect(screen.getByText('Delete this member?')).toBeInTheDocument()
  })

  it('confirms delete and navigates', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Delete'))
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
  })

  it('handles delete error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Delete failed'))
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Delete'))
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Delete failed'))
  })

  it('handles delete non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Delete'))
    const confirmBtn = screen.getByText('common.confirm')
    await user.click(confirmBtn)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete member'))
  })

  it('cancels delete', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Delete'))
    const cancelBtn = screen.getByText('common.cancel')
    await user.click(cancelBtn)
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows baptism record details', () => {
    render(<PersonDetail />)
    expect(screen.getAllByText('Communicant').length).toBeGreaterThan(0)
    expect(screen.getByText('John 3:16')).toBeInTheDocument()
    expect(screen.getByText('Pastor James')).toBeInTheDocument()
    expect(screen.getByText('First baptism')).toBeInTheDocument()
    expect(screen.getByText('Main Hall')).toBeInTheDocument()
    expect(screen.getByText('#101')).toBeInTheDocument()
  })

  it('renders person without baptism record', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, baptismRecord: null, baptised: false, isBaptised: false },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText('No baptism record available')).toBeInTheDocument()
  })

  it('renders person without church', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, church: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText('Not assigned')).toBeInTheDocument()
  })

  it('renders person without date of birth', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, dateOfBirth: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.queryByText('years')).not.toBeInTheDocument()
  })

  it('renders person without email and phone', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, emailAddress: null, email: null, tel: null, phoneNumber: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('Not provided').length).toBeGreaterThan(0)
  })

  it('renders person without address', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, address: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText('Not recorded')).toBeInTheDocument()
  })

  it('navigates to church detail', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    const churchBtns = screen.getAllByText('Grace Church')
    await user.click(churchBtns[0])
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('opens edit form with baptism fields', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Baptism Details')).toBeInTheDocument()
  })

  it('toggles baptism off in edit form', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    const toggle = screen.getByRole('checkbox')
    await user.click(toggle)
    expect(screen.queryByText('Baptism Details')).not.toBeInTheDocument()
    expect(screen.getByText('Non-Communicant Member')).toBeInTheDocument()
  })

  it('shows Make Church Admin button when church selected', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Make Church Admin')).toBeInTheDocument()
  })

  it('calls Make Church Admin', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    await user.click(screen.getByText('Make Church Admin'))
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
  })

  it('handles Make Church Admin error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Admin failed'))
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    await user.click(screen.getByText('Make Church Admin'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Admin failed'))
  })

  it('handles Make Church Admin non-Error', async () => {
    mockMutateAsync.mockRejectedValueOnce('str err')
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    await user.click(screen.getByText('Make Church Admin'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to make admin'))
  })

  it('shows pending state during update', async () => {
    vi.mocked(useUpdatePerson).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows position field', () => {
    render(<PersonDetail />)
    expect(screen.getAllByText('Member').length).toBeGreaterThan(0)
  })

  it('renders person with fallback gender', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, gender: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
  })

  it('renders person with email fallback', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, emailAddress: null, email: 'fallback@test.com', tel: null, phoneNumber: '9999' },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('fallback@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('9999').length).toBeGreaterThan(0)
  })

  it('renders church name without id as plain text', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, church: { id: null, name: 'Unknown Church' } },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    const spans = screen.getAllByText('Unknown Church')
    expect(spans.length).toBeGreaterThan(0)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders church without address', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, church: { id: 1, name: 'Grace Church', address: null } },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('Grace Church').length).toBeGreaterThan(0)
    expect(screen.queryByText('Church address')).not.toBeInTheDocument()
  })

  it('hides position when person has no position', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, position: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.queryByText('Position')).not.toBeInTheDocument()
  })

  it('hides baptism sub-fields when record fields are null', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { serialNumber: null, dateOfBaptism: null, worshipCenter: null, baptizedBy: null, bibleVerse: null, remark: null },
      },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.queryByText('Date of baptism')).not.toBeInTheDocument()
    expect(screen.queryByText('Serial number')).not.toBeInTheDocument()
    expect(screen.queryByText('Worship center')).not.toBeInTheDocument()
    expect(screen.queryByText('Baptised by')).not.toBeInTheDocument()
    expect(screen.queryByText('Bible verse')).not.toBeInTheDocument()
    expect(screen.queryByText('Remark')).not.toBeInTheDocument()
  })

  it('types into baptism edit fields when toggle is on', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    const getInputByLabel = (labelText: string) => {
      const labels = document.querySelectorAll('label.mf-label')
      for (const label of labels) {
        if (label.textContent?.trim().startsWith(labelText)) {
          return label.closest('.mf-field')!.querySelector('input, textarea') as HTMLInputElement
        }
      }
      throw new Error(`Label "${labelText}" not found`)
    }
    const serialInput = getInputByLabel('Serial Number')
    await user.clear(serialInput)
    await user.type(serialInput, '200')
    expect(serialInput).toHaveValue(200)
    const dateInput = getInputByLabel('Date of Baptism')
    await user.clear(dateInput)
    await user.type(dateInput, '2020-01-01')
    expect(dateInput).toHaveValue('2020-01-01')
    const worshipInput = getInputByLabel('Worship Center')
    await user.clear(worshipInput)
    await user.type(worshipInput, 'New Hall')
    expect(worshipInput).toHaveValue('New Hall')
    const bibleInput = getInputByLabel('Bible Verse')
    await user.clear(bibleInput)
    await user.type(bibleInput, 'Romans 8:28')
    expect(bibleInput).toHaveValue('Romans 8:28')
    const baptisedByInput = getInputByLabel('Baptised By')
    await user.clear(baptisedByInput)
    await user.type(baptisedByInput, 'Pastor John')
    expect(baptisedByInput).toHaveValue('Pastor John')
    const remarkInput = getInputByLabel('Remark')
    await user.clear(remarkInput)
    await user.type(remarkInput, 'New remark')
    expect(remarkInput).toHaveValue('New remark')
  }, 15000)

  it('hides Make Church Admin button when churchId is empty in edit form', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, church: null },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.queryByText('Make Church Admin')).not.toBeInTheDocument()
  })

  it('submits edit form with baptism toggled off', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    const toggle = screen.getByRole('checkbox')
    await user.click(toggle)
    expect(screen.getByText('Non-Communicant Member')).toBeInTheDocument()
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    const callArg = mockMutateAsync.mock.calls[0][0]
    expect(callArg.data.isBaptised).toBe(false)
    expect(callArg.data).not.toHaveProperty('serialNumber')
    expect(callArg.data).not.toHaveProperty('dateOfBaptism')
  })

  it('submits edit form with empty churchId sending null', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, church: null },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    const callArg = mockMutateAsync.mock.calls[0][0]
    expect(callArg.data.churchId).toBeNull()
  })

  it('renders baptism record with only some fields present', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { serialNumber: 50, dateOfBaptism: '2020-03-15', worshipCenter: null, baptizedBy: null, bibleVerse: null, remark: null },
      },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText('#50')).toBeInTheDocument()
    expect(screen.getByText(/March 15, 2020/)).toBeInTheDocument()
    expect(screen.queryByText('Worship center')).not.toBeInTheDocument()
    expect(screen.queryByText('Baptised by')).not.toBeInTheDocument()
  })

  it('formatDate returns raw string on invalid date', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { ...defaultPersonData.baptismRecord, dateOfBaptism: 'not-a-date' },
      },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText('not-a-date')).toBeInTheDocument()
  })

  it('computeAge decrements age when birthday has not occurred yet this year', () => {
    const futureMonth = new Date().getMonth() + 1
    const futureDay = new Date().getDate() + 1
    const dob = `2000-${String(futureMonth).padStart(2, '0')}-${String(Math.min(futureDay, 28)).padStart(2, '0')}`
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, dateOfBirth: dob },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText(/years old/)).toBeInTheDocument()
  })

  it('person baptised but with no baptism record shows neither record nor no-record text', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, baptismRecord: null, baptised: true, isBaptised: true },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('Communicant').length).toBeGreaterThan(0)
    expect(screen.queryByText('No baptism record available')).not.toBeInTheDocument()
  })

  it('person with no middle name hides middle name field', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, middleName: '' },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.queryByText('Middle name')).not.toBeInTheDocument()
  })

  it('contact bar shows only phone when no email or church', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, emailAddress: null, email: null, church: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('1234567').length).toBeGreaterThan(0)
    expect(screen.queryByText('john@test.com')).not.toBeInTheDocument()
  })

  it('contact bar shows only email when no phone or church', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, tel: null, phoneNumber: null, church: null },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('john@test.com').length).toBeGreaterThan(0)
  })

  it('edit form submits with baptism on and empty serialNumber sends null', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { serialNumber: null, dateOfBaptism: '2020-01-01', worshipCenter: 'Hall', baptizedBy: 'Pastor', bibleVerse: 'John 3:16', remark: '' },
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    const callArg = mockMutateAsync.mock.calls[0][0]
    expect(callArg.data.isBaptised).toBe(true)
    expect(callArg.data.serialNumber).toBeNull()
  })

  it('openEdit fills form with fallbacks for null person fields', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        middleName: null, gender: null, emailAddress: null, email: null,
        tel: null, phoneNumber: null, dateOfBirth: null, address: null,
        church: null, baptismRecord: null,
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Member')).toBeInTheDocument()
    const callArg = mockMutateAsync
  })

  it('openEdit fills form with fallbacks when baptismRecord fields are all null', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { serialNumber: null, dateOfBaptism: null, worshipCenter: null, baptizedBy: null, bibleVerse: null, remark: null },
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Member')).toBeInTheDocument()
  })

  it('handleEdit sends null for empty baptism fields', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { serialNumber: 42, dateOfBaptism: '2020-01-01', worshipCenter: 'Main', baptizedBy: 'Pastor', bibleVerse: 'John', remark: 'Note' },
      },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    const getInputByLabel = (labelText: string) => {
      const labels = document.querySelectorAll('label.mf-label')
      for (const label of labels) {
        if (label.textContent?.trim().startsWith(labelText)) {
          return label.closest('.mf-field')!.querySelector('input, textarea') as HTMLInputElement
        }
      }
      throw new Error(`Label "${labelText}" not found`)
    }
    await user.clear(getInputByLabel('Serial Number'))
    await user.clear(getInputByLabel('Date of Baptism'))
    await user.clear(getInputByLabel('Worship Center'))
    await user.clear(getInputByLabel('Bible Verse'))
    await user.clear(getInputByLabel('Baptised By'))
    await user.clear(getInputByLabel('Remark'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    const callArg = mockMutateAsync.mock.calls[0][0]
    expect(callArg.data.serialNumber).toBeNull()
    expect(callArg.data.dateOfBaptism).toBeNull()
    expect(callArg.data.worshipCenter).toBeNull()
    expect(callArg.data.bibleVerse).toBeNull()
    expect(callArg.data.baptisedBy).toBeNull()
    expect(callArg.data.remark).toBeNull()
  })

  it('person with baptised undefined falls back to isBaptised then false', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, baptised: undefined, isBaptised: undefined },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('Non-communicant').length).toBeGreaterThan(0)
  })

  it('person with baptised undefined uses isBaptised true', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, baptised: undefined, isBaptised: true },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('Communicant').length).toBeGreaterThan(0)
  })

  it('person with empty firstName and lastName renders correctly', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, firstName: '', lastName: '' },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getAllByText('M').length).toBeGreaterThan(0)
  })

  it('openEdit with baptised undefined uses isBaptised fallback', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, baptised: undefined, isBaptised: false },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Member')).toBeInTheDocument()
  })

  it('handleEdit with empty middleName sends null', async () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, middleName: '' },
      isLoading: false,
    } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    const callArg = mockMutateAsync.mock.calls[0][0]
    expect(callArg.data.middleName).toBeNull()
  })

  it('makeChurchAdmin button shows pending state', async () => {
    vi.mocked(useMakeChurchAdmin).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: true } as any)
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Setting admin...')).toBeInTheDocument()
  })

  it('baptism record with only worshipCenter and bibleVerse', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { serialNumber: null, dateOfBaptism: null, worshipCenter: 'Main', baptizedBy: null, bibleVerse: 'Romans', remark: 'Note' },
      },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText('Main')).toBeInTheDocument()
    expect(screen.getByText('Romans')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.queryByText('Serial number')).not.toBeInTheDocument()
    expect(screen.queryByText('Date of baptism')).not.toBeInTheDocument()
    expect(screen.queryByText('Baptised by')).not.toBeInTheDocument()
  })

  it('church name with no churchId renders plain text in both locations', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: { ...defaultPersonData, church: { id: null, name: 'My Church' } },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    const allChurches = screen.getAllByText('My Church')
    expect(allChurches.length).toBeGreaterThanOrEqual(2)
  })

  it('person with only baptism record fields remark and baptizedBy', () => {
    vi.mocked(usePerson).mockReturnValue({
      data: {
        ...defaultPersonData,
        baptismRecord: { serialNumber: null, dateOfBaptism: null, worshipCenter: null, baptizedBy: 'Pastor John', bibleVerse: null, remark: 'Special' },
      },
      isLoading: false,
    } as any)
    render(<PersonDetail />)
    expect(screen.getByText('Pastor John')).toBeInTheDocument()
    expect(screen.getByText('Special')).toBeInTheDocument()
  })

  it('edit form with baptism on and non-empty worshipCenter sends correct value', async () => {
    const user = userEvent.setup()
    render(<PersonDetail />)
    await user.click(screen.getByText('Edit'))
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    const callArg = mockMutateAsync.mock.calls[0][0]
    expect(callArg.data.worshipCenter).toBe('Main Hall')
    expect(callArg.data.baptisedBy).toBe('Pastor James')
    expect(callArg.data.bibleVerse).toBe('John 3:16')
  })
})
