import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  authApi,
  profileApi,
  type LoginRequest,
  type RegisterRequest,
  type PasswordResetRequest,
  type PasswordResetConfirmRequest,
  type ProfileUpdateRequest,
  type ProfileResponse,
  type ChangePasswordRequest,
  type ManagedUser,
  type Role,
} from '../services/api'
import { unwrap } from './useApi'

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => unwrap(authApi.login(data)),
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: (data: { accessToken: string; refreshToken: string }) => unwrap(authApi.logout(data)),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterRequest) => unwrap(authApi.register(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: PasswordResetRequest) => unwrap(authApi.requestPasswordReset(data)),
  })
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (data: PasswordResetConfirmRequest) => unwrap(authApi.confirmPasswordReset(data)),
  })
}

export function useUsers() {
  return useQuery<ManagedUser[]>({
    queryKey: ['users'],
    queryFn: () => unwrap(authApi.listUsers()),
  })
}

export function useAssignRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => unwrap(authApi.assignRole(userId, roleId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useRevokeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => unwrap(authApi.revokeRole(userId, roleId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useProfile() {
  return useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: () => unwrap(profileApi.getProfile()),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => unwrap(profileApi.updateProfile(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => unwrap(authApi.changePassword(data)),
  })
}
