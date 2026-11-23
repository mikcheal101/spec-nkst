package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.StepUpGuardService;
import com.mikkytrionze.auth.common.application.service.SuperAdminGovernanceService;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserGovernanceService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionService permissionService;
    private final SessionCutoffService sessionCutoffService;
    private final AuditLogService auditLogService;
    private final StepUpGuardService stepUpGuardService;
    private final SuperAdminGovernanceService governanceService;
    private final MeterRegistry meterRegistry;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<ManagedUserResponse> listUsers() {
        return Timer.builder("governance.user.list.timer").register(meterRegistry).record(() ->
                userRepository.findAll().stream()
                        .sorted(Comparator.comparing(User::getId))
                        .map(this::toManagedUserResponse)
                        .toList());
    }

    @Transactional(readOnly = true)
    public ManagedUserResponse getUser(Long targetUserId) {
        return Timer.builder("governance.user.view.timer").register(meterRegistry).record(() -> toManagedUserResponse(user(targetUserId)));
    }

    @Transactional
    public ManagedUserResponse provisionUser(String username, String rawPassword, Set<ERole> roles, AccountStatus status) {
        return Timer.builder("governance.user.provision.timer").register(meterRegistry).record(() -> {
            User actor = actor();
            if (username == null || username.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "username is required");
            if (rawPassword == null || rawPassword.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "password is required");
            if (userRepository.existsByUsername(username)) throw new ApiException(HttpStatus.CONFLICT, "USERNAME_ALREADY_EXISTS", "Username already exists");
            AccountStatus effectiveStatus = status == null ? AccountStatus.ACTIVE : status;
            Set<Role> resolvedRoles = (roles == null || roles.isEmpty())
                    ? Set.of(roleRepository.findByName(ERole.MEMBER_UNBAPTISED).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "ROLE_INVALID", "Default role not found")))
                    : roles.stream().map(r -> roleRepository.findByName(r).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "ROLE_INVALID", "Role not found"))).collect(Collectors.toSet());
            if (resolvedRoles.stream().anyMatch(r -> r.getName() == ERole.SUPER_ADMIN) && !governanceService.isSuperAdmin(actor)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "Only Super Admin can provision Super Admin users");
            }
            User created = User.builder()
                    .username(username.trim())
                    .password(passwordEncoder.encode(rawPassword))
                    .accountStatus(effectiveStatus)
                    .rootSuperAdmin(false)
                    .permissionEpoch(0L)
                    .roles(new HashSet<>(resolvedRoles))
                    .permissions(new HashSet<>())
                    .build();
            User saved = userRepository.save(created);
            auditLogService.record("USER_PROVISIONED", "USER", String.valueOf(saved.getId()), "SUCCESS", saved.getAccountStatus().name(), actor.getId(), actor.getUsername(), null, null, null, null);
            return toManagedUserResponse(saved);
        });
    }

    @Transactional
    public void assignRole(Long targetUserId, ERole roleName, String stepUpToken) {
        Timer.builder("governance.user.assign_role.timer").register(meterRegistry).record(() -> {
            User actor = actor();
            User target = user(targetUserId);
            Role role = roleRepository.findByName(roleName).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "ROLE_INVALID", "Role not found"));
            if (roleName == ERole.SUPER_ADMIN) {
                governanceService.assertStepUpRequiredForSecondarySuperAdmin(actor, target, stepUpToken, stepUpGuardService);
            }
            if (target.getRoles().stream().anyMatch(r -> r.getName() == roleName)) return;
            target.getRoles().add(role);
            userRepository.save(target);
            sessionCutoffService.cutoffUser(target, "ROLE_ASSIGNED", actor.getId(), actor.getUsername());
            auditLogService.record("USER_ROLE_ASSIGNED", "USER", String.valueOf(target.getId()), "SUCCESS", roleName.name(), actor.getId(), actor.getUsername(), null, null, null, null);
        });
    }

    @Transactional
    public void revokeRole(Long targetUserId, ERole roleName, String stepUpToken) {
        Timer.builder("governance.user.revoke_role.timer").register(meterRegistry).record(() -> {
            User actor = actor();
            User target = user(targetUserId);
            governanceService.assertNotRootSuperAdminMutation(target, "demoted");
            if (roleName == ERole.SUPER_ADMIN) {
                governanceService.assertStepUpRequiredForSecondarySuperAdmin(actor, target, stepUpToken, stepUpGuardService);
                governanceService.assertLastSuperAdminProtected(target, true, null);
            }
            target.setRoles(target.getRoles().stream().filter(r -> r.getName() != roleName).collect(Collectors.toSet()));
            userRepository.save(target);
            sessionCutoffService.cutoffUser(target, "ROLE_REVOKED", actor.getId(), actor.getUsername());
            auditLogService.record("USER_ROLE_REVOKED", "USER", String.valueOf(target.getId()), "SUCCESS", roleName.name(), actor.getId(), actor.getUsername(), null, null, null, null);
        });
    }

    @Transactional
    public void setAccountStatus(Long targetUserId, AccountStatus status, String stepUpToken) {
        Timer.builder("governance.user.status.timer").register(meterRegistry).record(() -> {
            User actor = actor();
            User target = user(targetUserId);
            if (status != AccountStatus.ACTIVE) governanceService.assertNotRootSuperAdminMutation(target, "disabled/suspended");
            governanceService.assertStepUpRequiredForSecondarySuperAdmin(actor, target, stepUpToken, stepUpGuardService);
            governanceService.assertLastSuperAdminProtected(target, false, status);
            target.setAccountStatus(status);
            userRepository.save(target);
            sessionCutoffService.cutoffUser(target, "ACCOUNT_STATUS_CHANGED", actor.getId(), actor.getUsername());
            auditLogService.record("USER_STATUS_CHANGED", "USER", String.valueOf(target.getId()), "SUCCESS", status.name(), actor.getId(), actor.getUsername(), null, null, null, null);
        });
    }

    @Transactional
    public void setDirectPermissions(Long targetUserId, Set<String> keys, boolean policyEnabled, String stepUpToken) {
        Timer.builder("governance.user.direct_permissions.timer").register(meterRegistry).record(() -> {
            User actor = actor();
            User target = user(targetUserId);
            if (!policyEnabled) {
                auditLogService.record("USER_DIRECT_PERMISSIONS", "USER", String.valueOf(target.getId()), "DENIED", "POLICY_DISABLED", actor.getId(), actor.getUsername(), null, null, null, null);
                throw new ApiException(HttpStatus.FORBIDDEN, "DIRECT_PERMISSIONS_DISABLED", "Direct user permissions are disabled by policy");
            }
            governanceService.assertStepUpRequiredForSecondarySuperAdmin(actor, target, stepUpToken, stepUpGuardService);
            Set<Permission> perms = keys == null ? Set.of() : keys.stream().map(permissionService::findByName).filter(java.util.Optional::isPresent).map(java.util.Optional::get).collect(Collectors.toSet());
            target.setPermissions(new HashSet<>(perms));
            userRepository.save(target);
            sessionCutoffService.cutoffUser(target, "DIRECT_PERMISSIONS_CHANGED", actor.getId(), actor.getUsername());
            auditLogService.record("USER_DIRECT_PERMISSIONS", "USER", String.valueOf(target.getId()), "SUCCESS", null, actor.getId(), actor.getUsername(), null, null, null, null);
        });
    }

    private ManagedUserResponse toManagedUserResponse(User u) {
        Set<String> roles = u.getRoles() == null ? Set.of() : u.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet());
        Set<String> permissions = u.getPermissions() == null ? Set.of() : u.getPermissions().stream()
                .flatMap(p -> java.util.stream.Stream.of(p.getKey(), p.getName()))
                .filter(v -> v != null && !v.isBlank())
                .collect(Collectors.toSet());
        return new ManagedUserResponse(String.valueOf(u.getId()), u.getUsername(), roles, u.getAccountStatus() == null ? "ACTIVE" : u.getAccountStatus().name(), null, permissions);
    }

    private User actor() {
        String name = SecurityContextHolder.getContext().getAuthentication() != null ? SecurityContextHolder.getContext().getAuthentication().getName() : null;
        if (name == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required");
        return userRepository.findByUsername(name).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required"));
    }

    private User user(Long id) { return userRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found")); }

    public record ManagedUserResponse(String id, String username, Set<String> roles, String status, String churchId, Set<String> permissions) {}
}
