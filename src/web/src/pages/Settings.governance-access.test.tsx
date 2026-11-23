import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  Trans: ({ children }: any) => children,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ id: '1' }), useSearchParams: () => [new URLSearchParams(), vi.fn()] }
})
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../shared/utils/swal', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn(), showConfirm: vi.fn().mockResolvedValue(true) }))
vi.mock('../services/api', async () => { const actual = await vi.importActual<any>('../services/api'); return { ...actual, auditApi: { list: vi.fn().mockResolvedValue({ data: [] }) } } })

const mockAuthUser: any = { username: 'limited', permissions: [], churchId: '1', roles: ['CHURCH_ADMIN'] }
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockAuthUser, loading: false, hasPermission: (req: any) => {
    const reqs = Array.isArray(req) ? req : [req]
    const perms = new Set((mockAuthUser.permissions||[]).map((p:string)=>String(p).toUpperCase()))
    return reqs.every((r:string)=>perms.has(String(r).toUpperCase()))
  }, refreshPermissions: vi.fn(), login: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

vi.mock('../hooks/useRoles', () => ({ useRolesList: () => ({ data: [], isLoading: false, error: null }), useUpdateRole: () => ({ mutateAsync: vi.fn(), isPending: false }), useDeleteRole: () => ({ mutateAsync: vi.fn(), isPending: false }) }))
vi.mock('../hooks/useAuth', () => ({ useUsers: () => ({ data: [], isLoading: false, error: null }), useRegister: () => ({ mutateAsync: vi.fn(), isPending: false }), useAssignRole: () => ({ mutateAsync: vi.fn(), isPending: false }), useRevokeRole: () => ({ mutateAsync: vi.fn(), isPending: false }), useSetUserStatus: () => ({ mutateAsync: vi.fn(), isPending: false }), useSetDirectPermissions: () => ({ mutateAsync: vi.fn(), isPending: false }) }))
vi.mock('../hooks/useConfig', () => ({ useConfig: () => ({ data: {}, isLoading: false }), useUpdateConfig: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }), useSystemConfigurations: () => ({ data: [], isLoading: false, error: null }), useUpsertSystemConfiguration: () => ({ mutateAsync: vi.fn(), isPending: false }) }))

import Settings from './Settings'

describe('Settings governance authorization', () => {
  it('hides audit/config tabs and shows role-access denial when unauthorized', () => {
    mockAuthUser.permissions = []
    render(<Settings />)
    expect(screen.queryByText('Audit Logs')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.configuration')).not.toBeInTheDocument()
    expect(screen.getByText("You don't have permission to view roles.")).toBeInTheDocument()
  })

  it('shows audit tab for authorized governance user', async () => {
    mockAuthUser.permissions = ['SETTINGS:READ', 'AUDIT:READ']
    render(<Settings />)
    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
  })
})
