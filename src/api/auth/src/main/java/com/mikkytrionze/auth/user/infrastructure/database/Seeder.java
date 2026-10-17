package com.mikkytrionze.auth.user.infrastructure.database;

import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.role.application.dto.ERole;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class Seeder {

    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;
    private final PermissionService permissionService;
    private final RoleRepository roleRepository;

    private static final String ADMIN_CRED = "super-admin";
    private static final List<String> RESOURCES = List.of(
            "church", "settings", "pastors", "elders",
            "members", "deacons", "projects", "notifications",
            "announcements", "roles", "permissions");

    @Bean
    CommandLineRunner seedDatabase(UserService userService, UserLookupService userLookupService) {
        return args -> {
            // 1. Seed all permissions across resources
            Set<Permission> allPermissions = RESOURCES.stream()
                    .flatMap(resource -> seedPermissions(resource).stream())
                    .collect(Collectors.toSet());

            // 2. Ensure all roles exist first
            seedRoles();

            // 3. Assign permissions to specific roles
            assignRolePermissions(allPermissions);

            // 4. Seed the default Super Admin user if not present
            seedSuperAdminUser(userService, userLookupService, allPermissions);
        };
    }

    private void seedRoles() {
        Arrays.stream(ERole.values()).forEach(roleName -> {
            if (roleService.findByName(roleName).isEmpty()) {
                Role role = Role.builder()
                        .name(roleName)
                        .permissions(Collections.emptySet())
                        .createdAt(Instant.now())
                        .createdBy(ADMIN_CRED)
                        .build();
                roleService.saveObject(role);
            }
        });
    }

    private void assignRolePermissions(Set<Permission> allPermissions) {
        // Super Admin: Exclude specific resources
        List<String> nonSuperAdminResources = List.of("deacons", "elders", "projects", "notifications");
        Set<Permission> superAdminPermissions = filterPermissions(allPermissions, nonSuperAdminResources, true);

        roleRepository.findByName(ERole.SUPER_ADMIN).ifPresent(role -> {
            role.setPermissions(superAdminPermissions);
            roleRepository.save(role);
        });

        // Church Admin: Restrict strictly to deacons, elders, and members
        List<String> churchAdminResources = List.of("deacons", "elders", "members", "announcements");
        Set<Permission> churchAdminPermissions = filterPermissions(allPermissions, churchAdminResources, false);

        roleRepository.findByName(ERole.CHURCH_ADMIN).ifPresent(role -> {
            role.setPermissions(churchAdminPermissions);
            roleRepository.save(role);
            log.info("CHURCH_ADMIN role successfully seeded with permissions for: deacons, elders, members, announcements");
        });
    }

    private Set<Permission> filterPermissions(Set<Permission> permissions, List<String> targetResources,
            boolean exclude) {
        return permissions.stream()
                .filter(p -> {
                    boolean matches = targetResources.stream()
                            .anyMatch(res -> p.getName().toLowerCase().contains(res));
                    return exclude ? !matches : matches;
                })
                .collect(Collectors.toSet());
    }

    private Set<Permission> seedPermissions(String resource) {
        Set<String> actionNames = Set.of("CAN_CREATE", "CAN_READ", "CAN_UPDATE", "CAN_DELETE", "CAN_VIEW");

        return actionNames.stream()
                .map(action -> {
                    String fullName = String.format("%s_%s", action, resource).toUpperCase();
                    return permissionService.findByName(fullName)
                            .orElseGet(() -> {
                                Permission permission = Permission.builder()
                                        .name(fullName)
                                        .createdAt(Instant.now())
                                        .createdBy(ADMIN_CRED)
                                        .build();
                                return permissionService.saveObject(permission);
                            });
                })
                .collect(Collectors.toSet());
    }

    private void seedSuperAdminUser(UserService userService, UserLookupService userLookupService,
            Set<Permission> allPermissions) {
        if (Objects.isNull(userLookupService.findByUsername(ADMIN_CRED))) {
            Role superAdminRole = roleRepository.findByName(ERole.SUPER_ADMIN)
                    .orElseThrow(() -> new RuntimeException("SUPER_ADMIN role not found"));

            User user = User.builder()
                    .username(ADMIN_CRED)
                    .password(passwordEncoder.encode(ADMIN_CRED))
                    .roles(new HashSet<>(Set.of(superAdminRole)))
                    .build();
            userService.saveObject(user);
            log.info("Super admin user seed saved successfully!");
        }
    }
}
