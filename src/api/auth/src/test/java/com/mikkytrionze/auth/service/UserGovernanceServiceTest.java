package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.StepUpGuardService;
import com.mikkytrionze.auth.common.application.service.SuperAdminGovernanceService;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.user.application.service.SessionCutoffService;
import com.mikkytrionze.auth.user.application.service.UserGovernanceService;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserGovernanceServiceTest {
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PermissionService permissionService;
    @Mock SessionCutoffService sessionCutoffService;
    @Mock AuditLogService auditLogService;
    @Mock StepUpGuardService stepUpGuardService;
    @Mock SuperAdminGovernanceService governanceService;
    @Mock PasswordEncoder passwordEncoder;
    UserGovernanceService service;

    @BeforeEach void setUp() {
        service = new UserGovernanceService(userRepository, roleRepository, permissionService, sessionCutoffService, auditLogService, stepUpGuardService, governanceService, new SimpleMeterRegistry(), passwordEncoder);
    }

    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    private User actor() { return User.builder().id(1L).username("actor").accountStatus(AccountStatus.ACTIVE).roles(new HashSet<>()).build(); }
    private User target(boolean root, AccountStatus status, Set<Role> roles) {
        return User.builder().id(2L).username("target").rootSuperAdmin(root).accountStatus(status).roles(new HashSet<>(roles)).build();
    }

    @Test
    void assignRole_superAdminRequiresStepUpAndCutsOff() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor","n"));
        User actor = actor(); User target = target(false, AccountStatus.ACTIVE, Set.of());
        Role superRole = Role.builder().id(10L).name(ERole.SUPER_ADMIN).build();
        when(userRepository.findByUsername("actor")).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(roleRepository.findByName(ERole.SUPER_ADMIN)).thenReturn(Optional.of(superRole));

        service.assignRole(2L, ERole.SUPER_ADMIN, "tok");

        verify(governanceService).assertStepUpRequiredForSecondarySuperAdmin(actor, target, "tok", stepUpGuardService);
        verify(sessionCutoffService).cutoffUser(eq(target), eq("ROLE_ASSIGNED"), eq(1L), eq("actor"));
        verify(auditLogService).record(eq("USER_ROLE_ASSIGNED"), eq("USER"), eq("2"), eq("SUCCESS"), eq("SUPER_ADMIN"), eq(1L), eq("actor"), any(), any(), any(), any());
        assertTrue(target.getRoles().stream().anyMatch(r -> r.getName()==ERole.SUPER_ADMIN));
    }

    @Test
    void revokeRole_blocksRootSuperAdminMutation() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor","n"));
        User actor = actor(); User target = target(true, AccountStatus.ACTIVE, Set.of(Role.builder().name(ERole.SUPER_ADMIN).build()));
        when(userRepository.findByUsername("actor")).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        doThrow(new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "ROOT_SUPER_ADMIN_IMMUTABLE", "x"))
                .when(governanceService).assertNotRootSuperAdminMutation(target, "demoted");

        ApiException ex = assertThrows(ApiException.class, () -> service.revokeRole(2L, ERole.SUPER_ADMIN, "tok"));
        assertEquals("ROOT_SUPER_ADMIN_IMMUTABLE", ex.getCode());
        verify(sessionCutoffService, never()).cutoffUser(any(), any(), any(), any());
    }

    @Test
    void setAccountStatus_blocksLastSuperAdminProtection() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor","n"));
        User actor = actor(); User target = target(false, AccountStatus.ACTIVE, Set.of(Role.builder().name(ERole.SUPER_ADMIN).build()));
        when(userRepository.findByUsername("actor")).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        doThrow(new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "LAST_SUPER_ADMIN_PROTECTED", "x"))
                .when(governanceService).assertLastSuperAdminProtected(target, false, AccountStatus.DISABLED);

        ApiException ex = assertThrows(ApiException.class, () -> service.setAccountStatus(2L, AccountStatus.DISABLED, "tok"));
        assertEquals("LAST_SUPER_ADMIN_PROTECTED", ex.getCode());
    }

    @Test
    void setDirectPermissions_deniesWhenPolicyDisabledAndAudits() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor","n"));
        User actor = actor(); User target = target(false, AccountStatus.ACTIVE, Set.of());
        when(userRepository.findByUsername("actor")).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));

        ApiException ex = assertThrows(ApiException.class, () -> service.setDirectPermissions(2L, Set.of("USERS:VIEW"), false, null));
        assertEquals(403, ex.getStatus().value());
        assertEquals("DIRECT_PERMISSIONS_DISABLED", ex.getCode());
        verify(auditLogService).record(eq("USER_DIRECT_PERMISSIONS"), eq("USER"), eq("2"), eq("DENIED"), eq("POLICY_DISABLED"), eq(1L), eq("actor"), any(), any(), any(), any());
        verify(sessionCutoffService, never()).cutoffUser(any(), any(), any(), any());
    }

    @Test
    void setDirectPermissions_allowsWhenPolicyEnabledAndCutsOff() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor","n"));
        User actor = actor(); User target = target(false, AccountStatus.ACTIVE, Set.of());
        Permission p = Permission.builder().id(5L).key("USERS:VIEW").name("CAN_VIEW_USERS").build();
        when(userRepository.findByUsername("actor")).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(permissionService.findByName("USERS:VIEW")).thenReturn(Optional.of(p));

        service.setDirectPermissions(2L, Set.of("USERS:VIEW"), true, "tok");

        verify(governanceService).assertStepUpRequiredForSecondarySuperAdmin(actor, target, "tok", stepUpGuardService);
        verify(sessionCutoffService).cutoffUser(eq(target), eq("DIRECT_PERMISSIONS_CHANGED"), eq(1L), eq("actor"));
        verify(auditLogService).record(eq("USER_DIRECT_PERMISSIONS"), eq("USER"), eq("2"), eq("SUCCESS"), any(), eq(1L), eq("actor"), any(), any(), any(), any());
        assertTrue(target.getPermissions().stream().anyMatch(x -> "USERS:VIEW".equals(x.getKey())));
    }
}
