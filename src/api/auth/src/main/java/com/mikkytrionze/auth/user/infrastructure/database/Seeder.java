package com.mikkytrionze.auth.user.infrastructure.database;

import tools.jackson.databind.ObjectMapper;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.infrastructure.database.seed.CanonicalBaseline;
import com.mikkytrionze.auth.user.infrastructure.database.seed.CanonicalBaselineLoader;
import com.mikkytrionze.auth.user.infrastructure.database.seed.SeedReconciliationReport;
import com.mikkytrionze.role.application.dto.ERole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class Seeder {

    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CanonicalBaselineLoader baselineLoader;
    private final ObjectMapper objectMapper;

    @Bean
    CommandLineRunner seedDatabase() {
        return args -> {
            CanonicalBaseline baseline = baselineLoader.load();
            SeedReconciliationReport report = SeedReconciliationReport.empty();
            Map<Long, Permission> permissionsById = reconcilePermissions(baseline, report);
            Map<Long, Role> rolesById = reconcileRoles(baseline, permissionsById, report);
            reconcileUsers(baseline, rolesById, report);
            writeReport(report);
            log.info("Seed reconciliation complete. created={}, updated={}, unchanged={}, warnings={}",
                    report.created().size(), report.updated().size(), report.unchanged().size(), report.warnings().size());
        };
    }

    private Map<Long, Permission> reconcilePermissions(CanonicalBaseline baseline, SeedReconciliationReport report) {
        Map<Long, Permission> byBaselineId = new HashMap<>();
        for (CanonicalBaseline.PermissionSeed seed : baseline.permissions()) {
            Optional<Permission> existing = permissionRepository.findByKey(seed.key());
            if (existing.isEmpty()) existing = permissionRepository.findByLegacyAlias(seed.legacyAlias());
            if (existing.isEmpty() && seed.resource() != null && seed.action() != null) {
                existing = permissionRepository.findByResourceAndAction(seed.resource(), seed.action());
            }
            Permission p = existing.orElseGet(() -> Permission.builder()
                    .createdAt(Instant.now()).createdBy("seed-baseline").build());
            boolean isNew = p.getId() == null;
            boolean changed = isNew
                    || !Objects.equals(p.getName(), seed.legacyAlias())
                    || !Objects.equals(p.getKey(), seed.key())
                    || !Objects.equals(p.getResource(), seed.resource())
                    || !Objects.equals(p.getAction(), seed.action())
                    || !Objects.equals(p.getLegacyAlias(), seed.legacyAlias())
                    || p.isActive() != Boolean.TRUE.equals(seed.active());
            p.setName(seed.legacyAlias());
            p.setKey(seed.key());
            p.setResource(seed.resource());
            p.setAction(seed.action());
            p.setLegacyAlias(seed.legacyAlias());
            p.setActive(Boolean.TRUE.equals(seed.active()));
            if (p.getCreatedBy() == null) p.setCreatedBy("seed-baseline");
            Permission saved = permissionRepository.save(p);
            byBaselineId.put(seed.id(), saved);
            if (isNew) report.addCreated("permission:" + seed.key());
            else if (changed) report.addUpdated("permission:" + seed.key());
            else report.addUnchanged("permission:" + seed.key());
        }
        return byBaselineId;
    }

    private Map<Long, Role> reconcileRoles(CanonicalBaseline baseline, Map<Long, Permission> permissionsById, SeedReconciliationReport report) {
        Map<Long, Set<Long>> rolePermIds = new HashMap<>();
        for (CanonicalBaseline.RolePermissionSeed rp : baseline.rolePermissions()) {
            rolePermIds.computeIfAbsent(rp.roleId(), k -> new HashSet<>()).add(rp.permissionId());
        }
        Map<Long, Role> byBaselineId = new HashMap<>();
        for (CanonicalBaseline.RoleSeed seed : baseline.roles()) {
            ERole erole = ERole.valueOf(seed.name());
            Role role = roleRepository.findByName(erole).orElseGet(() -> Role.builder()
                    .name(erole).createdAt(Instant.now()).createdBy("seed-baseline").permissions(new HashSet<>()).build());
            boolean isNew = role.getId() == null;
            Set<Permission> desired = rolePermIds.getOrDefault(seed.id(), Set.of()).stream()
                    .map(permissionsById::get).filter(Objects::nonNull).collect(Collectors.toSet());
            boolean changed = isNew
                    || !Objects.equals(role.getDisplayName(), seed.displayName())
                    || role.isSystem() != Boolean.TRUE.equals(seed.isSystem())
                    || role.isProtectedRole() != Boolean.TRUE.equals(seed.isProtected())
                    || role.isActive() != Boolean.TRUE.equals(seed.active())
                    || !samePermissionIds(role.getPermissions(), desired);
            role.setDisplayName(seed.displayName());
            role.setSystem(Boolean.TRUE.equals(seed.isSystem()));
            role.setProtectedRole(Boolean.TRUE.equals(seed.isProtected()));
            role.setActive(Boolean.TRUE.equals(seed.active()));
            role.setPermissions(desired);
            if (role.getCreatedBy() == null) role.setCreatedBy("seed-baseline");
            Role saved = roleRepository.save(role);
            byBaselineId.put(seed.id(), saved);
            if (isNew) report.addCreated("role:" + seed.name());
            else if (changed) report.addUpdated("role:" + seed.name());
            else report.addUnchanged("role:" + seed.name());
        }
        return byBaselineId;
    }

    private void reconcileUsers(CanonicalBaseline baseline, Map<Long, Role> rolesById, SeedReconciliationReport report) {
        Map<Long, Set<Long>> userRoleIds = new HashMap<>();
        if (baseline.userRoles() != null) {
            for (CanonicalBaseline.UserRoleSeed ur : baseline.userRoles()) {
                userRoleIds.computeIfAbsent(ur.userId(), k -> new HashSet<>()).add(ur.roleId());
            }
        }
        for (CanonicalBaseline.UserSeed seed : baseline.users()) {
            User user = userRepository.findByUsername(seed.username()).orElseGet(() -> User.builder()
                    .username(seed.username()).build());
            boolean isNew = user.getId() == null;
            Set<Role> desiredRoles = userRoleIds.getOrDefault(seed.id(), Set.of()).stream()
                    .map(rolesById::get).filter(Objects::nonNull).collect(Collectors.toSet());
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                String hash = seed.passwordHash();
                if (hash == null || hash.isBlank()) hash = passwordEncoder.encode("ChangeMe!123");
                user.setPassword(hash);
            }
            AccountStatus status = seed.accountStatus() != null ? AccountStatus.valueOf(seed.accountStatus()) : AccountStatus.ACTIVE;
            boolean changed = isNew
                    || user.getAccountStatus() != status
                    || user.isRootSuperAdmin() != Boolean.TRUE.equals(seed.isRootSuperAdmin())
                    || user.getPermissionEpoch() != (seed.permissionEpoch() == null ? 0L : seed.permissionEpoch().longValue())
                    || !sameRoleIds(user.getRoles(), desiredRoles);
            user.setAccountStatus(status);
            user.setRootSuperAdmin(Boolean.TRUE.equals(seed.isRootSuperAdmin()));
            if (user.getPermissionEpoch() == 0L && seed.permissionEpoch() != null) user.setPermissionEpoch(seed.permissionEpoch());
            user.setRoles(desiredRoles);
            userRepository.save(user);
            if (isNew) report.addCreated("user:" + seed.username());
            else if (changed) report.addUpdated("user:" + seed.username());
            else report.addUnchanged("user:" + seed.username());
        }
        enforceInvariants(report);
    }

    private void enforceInvariants(SeedReconciliationReport report) {
        long activeRoots = userRepository.findAll().stream().filter(User::isRootSuperAdmin)
                .filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE).count();
        if (activeRoots < 1) {
            report.addWarning("INVARIANT_VIOLATION: no active root super admin after reconciliation");
            throw new IllegalStateException("No active Root Super Admin after seed reconciliation");
        }
        roleRepository.findByName(ERole.SUPER_ADMIN).ifPresent(r -> {
            if (!r.isProtectedRole()) { r.setProtectedRole(true); r.setSystem(true); roleRepository.save(r); report.addUpdated("role:SUPER_ADMIN:protected"); }
        });
    }

    private boolean samePermissionIds(Set<Permission> a, Set<Permission> b) {
        Set<Long> as = a == null ? Set.of() : a.stream().map(Permission::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> bs = b == null ? Set.of() : b.stream().map(Permission::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        return as.equals(bs);
    }

    private boolean sameRoleIds(Set<Role> a, Set<Role> b) {
        Set<Long> as = a == null ? Set.of() : a.stream().map(Role::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> bs = b == null ? Set.of() : b.stream().map(Role::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        return as.equals(bs);
    }

    private void writeReport(SeedReconciliationReport report) {
        try {
            Path out = Path.of("specs/007-engr-003-backend-auth-super-admin-verification/artifacts/seed-reconciliation-report.json");
            Files.createDirectories(out.getParent());
            Files.writeString(out, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(report));
        } catch (Exception e) {
            log.warn("Failed to write seed reconciliation report: {}", e.getMessage());
        }
    }
}
