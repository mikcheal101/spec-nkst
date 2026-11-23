package com.mikkytrionze.auth.roles.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.StepUpGuardService;
import com.mikkytrionze.auth.common.application.service.SuperAdminGovernanceService;
import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.api.request.RoleRequest;
import com.mikkytrionze.auth.roles.application.exception.RoleNotFoundException;
import com.mikkytrionze.auth.roles.application.mapper.RoleMapper;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.SessionCutoffService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final PermissionService permissionService;
    private final UserRepository userRepository;
    private final SessionCutoffService sessionCutoffService;
    private final AuditLogService auditLogService;
    private final StepUpGuardService stepUpGuardService;
    private final SuperAdminGovernanceService governanceService;

    @Override
    public List<RolesResponse> fetchRoles() {
        return roleRepository.findAll().stream().map(roleMapper::toResponse).toList();
    }

    @Override
    public Role saveObject(Role role) throws IllegalArgumentException {
        if (Objects.isNull(role)) throw new IllegalArgumentException("Role cannot be null!");
        return roleRepository.findByName(role.getName())
                .map(existingRole -> { existingRole.setPermissions(role.getPermissions()); return roleRepository.save(existingRole); })
                .orElseGet(() -> roleRepository.saveAndFlush(role));
    }

    @Override
    public Role updateObject(Role role) {
        if (Objects.isNull(role)) throw new IllegalArgumentException("Role cannot be null!");
        return roleRepository.findByName(role.getName()).isPresent() ? roleRepository.save(role) : role;
    }

    @Override
    public Optional<Role> findByName(ERole role) { return roleRepository.findByName(role); }

    @Override
    public RolesResponse getRoleById(final Long id) {
        Role fetchedRole = roleRepository.findById(id).orElseThrow(() -> new RoleNotFoundException(null));
        return roleMapper.toResponse(fetchedRole);
    }

    @Override
    @Transactional
    public RolesResponse updateRole(final Long id, final RoleRequest request) {
        Role fetchedRole = roleRepository.findById(id).orElseThrow(() -> new RoleNotFoundException(null));
        User actor = currentUser();
        boolean superAdminRole = fetchedRole.getName() == ERole.SUPER_ADMIN;
        if (fetchedRole.isProtectedRole() || superAdminRole) {
            // secondary super admin governance mutation requires step-up
            if (actor == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required");
            if (superAdminRole) {
                stepUpGuardService.requireValidStepUp(request.getStepUpToken(), actor.getId());
            }
        }

        Set<Permission> permissions = request.getPermissions().stream()
                .map(permissionService::findByName)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
        if (permissions.size() != new HashSet<>(request.getPermissions()).size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PERMISSION_INVALID", "One or more permissions are invalid");
        }

        if (superAdminRole) {
            ensureLastSuperAdminRetainsCorePermissions(fetchedRole, permissions);
        }

        Set<Long> before = fetchedRole.getPermissions().stream().map(Permission::getId).collect(Collectors.toSet());
        fetchedRole.setPermissions(permissions);
        Role updatedRole = roleRepository.save(fetchedRole);
        Set<Long> after = updatedRole.getPermissions().stream().map(Permission::getId).collect(Collectors.toSet());
        if (!before.equals(after)) {
            cutoffAffectedUsers(updatedRole, actor);
            auditLogService.record("ROLE_PERMISSIONS_UPDATED", "ROLE", String.valueOf(updatedRole.getId()), "SUCCESS", null,
                    actor != null ? actor.getId() : null, actor != null ? actor.getUsername() : null, null, null, null, null);
        }
        return roleMapper.toResponse(updatedRole);
    }

    @Override
    @Transactional
    public void deleteRole(final Long id) {
        Role fetchedRole = roleRepository.findById(id).orElseThrow(() -> new RoleNotFoundException(null));
        if (fetchedRole.isProtectedRole() || fetchedRole.getName() == ERole.SUPER_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ROLE_PROTECTED", "Protected role cannot be deleted");
        }
        roleRepository.delete(fetchedRole);
    }

    private void ensureLastSuperAdminRetainsCorePermissions(Role role, Set<Permission> newPerms) {
        boolean hasCore = newPerms.stream().anyMatch(p -> "ROLES:UPDATE".equals(p.getKey()) || "PERMISSIONS:UPDATE".equals(p.getKey()) || "can_update_roles".equalsIgnoreCase(p.getName()));
        if (!hasCore) {
            long activeSuperAdmins = userRepository.findAll().stream()
                    .filter(u -> u.getAccountStatus() == com.mikkytrionze.auth.user.domain.model.AccountStatus.ACTIVE)
                    .filter(governanceService::isSuperAdmin).count();
            if (activeSuperAdmins <= 1) {
                throw new ApiException(HttpStatus.FORBIDDEN, "LAST_SUPER_ADMIN_PROTECTED", "Cannot remove core governance permissions from last active Super Admin");
            }
        }
    }

    private void cutoffAffectedUsers(Role role, User actor) {
        userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> Objects.equals(r.getId(), role.getId())))
                .forEach(u -> sessionCutoffService.cutoffUser(u, "ROLE_PERMISSION_CHANGED", actor != null ? actor.getId() : null, actor != null ? actor.getUsername() : null));
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }
}
