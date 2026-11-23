package com.mikkytrionze.auth.user.infrastructure.database;

import tools.jackson.databind.ObjectMapper;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.infrastructure.database.seed.CanonicalBaseline;
import com.mikkytrionze.auth.user.infrastructure.database.seed.CanonicalBaselineLoader;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeederTest {

    @Mock PasswordEncoder passwordEncoder;
    @Mock PermissionService permissionService;
    @Mock PermissionRepository permissionRepository;
    @Mock RoleRepository roleRepository;
    @Mock UserRepository userRepository;
    @Mock CanonicalBaselineLoader baselineLoader;

    @Test
    void seedDatabase_reconcilesFromBaseline() throws Exception {
        CanonicalBaseline baseline = new CanonicalBaseline(
                "1.0.0", "2026-11-22T00:00:00Z", Map.of("type","test"),
                List.of(new CanonicalBaseline.UserSeed(1L,"super-admin","hash","ACTIVE",true,0)),
                List.of(new CanonicalBaseline.RoleSeed(1L,"SUPER_ADMIN","Super Admin",true,true,true)),
                List.of(new CanonicalBaseline.PermissionSeed(1L,"CHURCH:VIEW","CHURCH","VIEW","CAN_VIEW_CHURCH",true)),
                List.of(new CanonicalBaseline.RolePermissionSeed(1L,1L)),
                List.of(new CanonicalBaseline.UserRoleSeed(1L,1L)),
                Map.of()
        );
        when(baselineLoader.load()).thenReturn(baseline);
        when(permissionRepository.findByKey(anyString())).thenReturn(Optional.empty());
        when(permissionRepository.findByLegacyAlias(anyString())).thenReturn(Optional.empty());
        when(permissionRepository.findByResourceAndAction(anyString(), anyString())).thenReturn(Optional.empty());
        when(permissionRepository.save(any(Permission.class))).thenAnswer(i -> { Permission p=i.getArgument(0); if(p.getId()==null) p.setId(1L); return p; });
        when(roleRepository.findByName(ERole.SUPER_ADMIN)).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> { Role r=i.getArgument(0); if(r.getId()==null) r.setId(1L); return r; });
        when(userRepository.findByUsername("super-admin")).thenReturn(Optional.empty());
        when(userRepository.findAll()).thenAnswer(i -> List.of(User.builder().id(1L).username("super-admin").rootSuperAdmin(true).accountStatus(com.mikkytrionze.auth.user.domain.model.AccountStatus.ACTIVE).build()));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        Seeder seeder = new Seeder(passwordEncoder, permissionService, permissionRepository, roleRepository, userRepository, baselineLoader, new ObjectMapper());
        CommandLineRunner runner = seeder.seedDatabase();
        runner.run(new String[]{});

        verify(permissionRepository, atLeastOnce()).save(any(Permission.class));
        verify(roleRepository, atLeastOnce()).save(any(Role.class));
        verify(userRepository, atLeastOnce()).save(any(User.class));
    }
}
