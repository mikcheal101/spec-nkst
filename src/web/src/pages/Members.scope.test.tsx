import { render, screen, waitFor } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../hooks/usePeople', () => ({ usePeopleList: () => ({ data: { content: [], totalPages: 0, totalElements: 0 }, isLoading: false }), useCreatePerson: () => ({ mutateAsync: vi.fn(), isPending: false }), useUpdatePerson: () => ({ mutateAsync: vi.fn(), isPending: false }), useDeletePerson: () => ({ mutateAsync: vi.fn(), isPending: false }), useMakeChurchAdmin: () => ({ mutateAsync: vi.fn(), isPending: false }) }))
vi.mock('../hooks/useChurches', () => ({ useAllChurches: () => ({ data: { content: [{ id: 1, name: 'Scoped Church' }] } }) }))
vi.mock('../shared/components/ConfirmDialog', () => ({ default: () => null }))

const authState: any = { user: { username: 'u', permissions: [], churchId: '1', roles: [] }, loading: false }
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ ...authState, hasPermission: (req: any) => {
    const reqs = Array.isArray(req) ? req : [req]
    const perms = new Set((authState.user.permissions||[]).map((p:string)=>String(p).toUpperCase()))
    return reqs.every((r:string)=>perms.has(String(r).toUpperCase()))
  } }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

import Members from './Members'

describe('Members scope/permission UX', () => {
  it('hides create action when MEMBERS:CREATE permission is missing', async () => {
    authState.user.permissions = ['MEMBERS:READ']
    render(<Members />)
    await waitFor(() => expect(screen.getByText('members.title')).toBeInTheDocument())
    expect(screen.queryByText('members.addMember')).not.toBeInTheDocument()
  })
})
