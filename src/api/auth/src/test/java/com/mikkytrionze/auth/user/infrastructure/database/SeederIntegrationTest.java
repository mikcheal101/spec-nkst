package com.mikkytrionze.auth.user.infrastructure.database;

import tools.jackson.databind.ObjectMapper;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.roles.application.service.PermissionServiceImpl;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.infrastructure.database.seed.CanonicalBaselineLoader;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Idempotent seeder/bootstrap integration-style test (stateful in-memory repository simulation).
 * Verifies: run twice => no drift/duplicates/destructive loss; canonical 5-action matrix; Root Super Admin/protected metadata.
 */
@ExtendWith(MockitoExtension.class)
class SeederIntegrationTest {

    @Mock PasswordEncoder passwordEncoder;
    @Mock PermissionService permissionService;
    @Mock PermissionRepository permissionRepository;
    @Mock RoleRepository roleRepository;
    @Mock UserRepository userRepository;

    private final Map<Long, Permission> permStore = new LinkedHashMap<>();
    private final Map<Long, Role> roleStore = new LinkedHashMap<>();
    private final Map<Long, User> userStore = new LinkedHashMap<>();
    private final AtomicLong permSeq = new AtomicLong(100);
    private final AtomicLong roleSeq = new AtomicLong(100);
    private final AtomicLong userSeq = new AtomicLong(100);

    @BeforeEach
    void wireStatefulRepos() {
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        lenient().when(permissionRepository.findByKey(anyString())).thenAnswer(i -> permStore.values().stream().filter(p -> Objects.equals(p.getKey(), i.getArgument(0))).findFirst());
        lenient().when(permissionRepository.findByLegacyAlias(anyString())).thenAnswer(i -> permStore.values().stream().filter(p -> Objects.equals(p.getLegacyAlias(), i.getArgument(0))).findFirst());
        lenient().when(permissionRepository.findByResourceAndAction(anyString(), anyString())).thenAnswer(i -> permStore.values().stream().filter(p -> Objects.equals(p.getResource(), i.getArgument(0)) && Objects.equals(p.getAction(), i.getArgument(1))).findFirst());
        lenient().when(permissionRepository.findByName(anyString())).thenAnswer(i -> permStore.values().stream().filter(p -> Objects.equals(p.getName(), i.getArgument(0))).findFirst());
        lenient().when(permissionRepository.findAll()).thenAnswer(i -> new ArrayList<>(permStore.values()));
        lenient().when(permissionRepository.save(any(Permission.class))).thenAnswer(i -> {
            Permission p = i.getArgument(0);
            if (p.getId() == null) p.setId(permSeq.incrementAndGet());
            permStore.put(p.getId(), p);
            return p;
        });

        lenient().when(roleRepository.findByName(any(ERole.class))).thenAnswer(i -> roleStore.values().stream().filter(r -> r.getName() == i.getArgument(0)).findFirst());
        lenient().when(roleRepository.findAll()).thenAnswer(i -> new ArrayList<>(roleStore.values()));
        lenient().when(roleRepository.save(any(Role.class))).thenAnswer(i -> {
            Role r = i.getArgument(0);
            if (r.getId() == null) r.setId(roleSeq.incrementAndGet());
            roleStore.put(r.getId(), r);
            return r;
        });

        lenient().when(userRepository.findByUsername(anyString())).thenAnswer(i -> userStore.values().stream().filter(u -> Objects.equals(u.getUsername(), i.getArgument(0))).findFirst());
        lenient().when(userRepository.findAll()).thenAnswer(i -> new ArrayList<>(userStore.values()));
        lenient().when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            if (u.getId() == null) u.setId(userSeq.incrementAndGet());
            userStore.put(u.getId(), u);
            return u;
        });
    }

    @Test
    void seeder_isIdempotent_andReconcilesCanonicalBaseline() throws Exception {
        CanonicalBaselineLoader loader = new CanonicalBaselineLoader(new ObjectMapper());
        Seeder seeder = new Seeder(passwordEncoder, permissionService, permissionRepository, roleRepository, userRepository, loader, new ObjectMapper());

        seeder.seedDatabase().run();
        Snapshot first = snapshot();

        assertFalse(first.permissionKeys.isEmpty(), "permissions should be seeded");
        assertTrue(first.hasFiveActionMatrix, "canonical 5-action matrix must be present");
        assertTrue(first.roleNames.contains("SUPER_ADMIN"), "SUPER_ADMIN role must exist");
        assertTrue(first.superAdminProtected, "SUPER_ADMIN must be protected");
        assertTrue(first.activeRootSuperAdmins >= 1, "active Root Super Admin must exist");
        assertTrue(first.permissionKeys.contains("CHURCH:VIEW"), "canonical key CHURCH:VIEW expected");

        seeder.seedDatabase().run();
        Snapshot second = snapshot();

        assertEquals(first.permissionKeys, second.permissionKeys, "permission keys drifted");
        assertEquals(first.roleNames, second.roleNames, "role names drifted");
        assertEquals(first.permissionCount, second.permissionCount, "permission duplicates/drift detected");
        assertEquals(first.roleCount, second.roleCount, "role duplicates/drift detected");
        assertEquals(first.userCount, second.userCount, "user duplicates/destructive loss detected");
        assertEquals(first.activeRootSuperAdmins, second.activeRootSuperAdmins, "root super admin drifted");
        assertTrue(second.superAdminProtected, "SUPER_ADMIN must remain protected");
        assertTrue(second.hasFiveActionMatrix, "canonical 5-action matrix must remain present");
    }

    private Snapshot snapshot() {
        Set<String> keys = permStore.values().stream().map(Permission::getKey).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<String> actions = permStore.values().stream().map(Permission::getAction).filter(Objects::nonNull).collect(Collectors.toSet());
        boolean five = actions.containsAll(Set.of("CREATE", "READ", "VIEW", "UPDATE", "DELETE"));
        Set<String> roles = roleStore.values().stream().map(r -> r.getName().name()).collect(Collectors.toSet());
        boolean superProtected = roleStore.values().stream().filter(r -> r.getName() == ERole.SUPER_ADMIN).anyMatch(Role::isProtectedRole);
        long roots = userStore.values().stream().filter(User::isRootSuperAdmin).filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE).count();
        return new Snapshot(keys, roles, superProtected, roots, five, permStore.size(), roleStore.size(), userStore.size());
    }

    private record Snapshot(Set<String> permissionKeys, Set<String> roleNames, boolean superAdminProtected, long activeRootSuperAdmins, boolean hasFiveActionMatrix, int permissionCount, int roleCount, int userCount) {}
}
