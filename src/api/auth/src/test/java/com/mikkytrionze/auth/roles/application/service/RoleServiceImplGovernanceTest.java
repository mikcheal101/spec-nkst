package com.mikkytrionze.auth.roles.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.StepUpGuardService;
import com.mikkytrionze.auth.common.application.service.SuperAdminGovernanceService;
import com.mikkytrionze.auth.roles.api.request.RoleRequest;
import com.mikkytrionze.auth.roles.application.mapper.RoleMapper;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.user.application.service.SessionCutoffService;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplGovernanceTest {
    @Mock RoleRepository roleRepository;
    @Mock RoleMapper roleMapper;
    @Mock PermissionService permissionService;
    @Mock UserRepository userRepository;
    @Mock SessionCutoffService sessionCutoffService;
    @Mock AuditLogService auditLogService;
    @Mock StepUpGuardService stepUpGuardService;
    @Mock SuperAdminGovernanceService governanceService;
    @InjectMocks RoleServiceImpl roleService;

    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test
    void updateSuperAdminRole_requiresStepUpAndCutsOffAffectedUsers() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor", "n"));
        User actor = User.builder().id(1L).username("actor").accountStatus(AccountStatus.ACTIVE).build();
        when(userRepository.findByUsername("actor")).thenReturn(Optional.of(actor));
        Role superRole = Role.builder().id(10L).name(ERole.SUPER_ADMIN).protectedRole(true).permissions(new java.util.HashSet<>(Set.of(Permission.builder().id(1L).key("ROLES:VIEW").name("CAN_VIEW_ROLES").build()))).build();
        Permission p2 = Permission.builder().id(2L).key("ROLES:UPDATE").name("CAN_UPDATE_ROLES").build();
        when(roleRepository.findById(10L)).thenReturn(Optional.of(superRole));
        when(permissionService.findByName("ROLES:UPDATE")).thenReturn(Optional.of(p2));
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> i.getArgument(0));
        when(userRepository.findAll()).thenReturn(List.of(User.builder().id(2L).username("target").accountStatus(AccountStatus.ACTIVE).roles(new java.util.HashSet<>(Set.of(superRole))).build()));
        when(roleMapper.toResponse(any())).thenReturn(null);

        RoleRequest req = RoleRequest.builder().permissions(List.of("ROLES:UPDATE")).stepUpToken("step").build();
        roleService.updateRole(10L, req);

        verify(stepUpGuardService).requireValidStepUp("step", 1L);
        verify(sessionCutoffService).cutoffUser(any(User.class), eq("ROLE_PERMISSION_CHANGED"), eq(1L), eq("actor"));
        verify(auditLogService).record(eq("ROLE_PERMISSIONS_UPDATED"), eq("ROLE"), eq("10"), eq("SUCCESS"), any(), eq(1L), eq("actor"), any(), any(), any(), any());
    }

    @Test
    void updateSuperAdminRole_rejectsInvalidPermission() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor", "n"));
        when(userRepository.findByUsername("actor")).thenReturn(Optional.of(User.builder().id(1L).username("actor").build()));
        Role superRole = Role.builder().id(10L).name(ERole.SUPER_ADMIN).protectedRole(true).permissions(new java.util.HashSet<>()).build();
        when(roleRepository.findById(10L)).thenReturn(Optional.of(superRole));
        when(permissionService.findByName("BAD:KEY")).thenReturn(Optional.empty());
        RoleRequest req = RoleRequest.builder().permissions(List.of("BAD:KEY")).stepUpToken("step").build();
        ApiException ex = assertThrows(ApiException.class, () -> roleService.updateRole(10L, req));
        assertEquals("PERMISSION_INVALID", ex.getCode());
    }
}
