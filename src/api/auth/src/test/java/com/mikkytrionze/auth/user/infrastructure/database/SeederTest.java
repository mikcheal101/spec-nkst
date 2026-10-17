package com.mikkytrionze.auth.user.infrastructure.database;

import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeederTest {

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RoleService roleService;

    @Mock
    private PermissionService permissionService;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserService userService;

    @Mock
    private UserLookupService userLookupService;

    @InjectMocks
    private Seeder seeder;

    @BeforeEach
    void setUp() {
        lenient().when(passwordEncoder.encode(any(String.class))).thenReturn("encoded-pw");
    }

    @Test
    void seedSuperAdmin_whenNoExistingAdmin_createsAdmin() throws Exception {
        when(userLookupService.findByUsername("super-admin")).thenReturn(null);
        when(permissionService.findByName(any(String.class))).thenReturn(Optional.empty());
        when(permissionService.saveObject(any(Permission.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roleService.findByName(any(ERole.class))).thenReturn(Optional.empty());
        when(roleService.saveObject(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
        Role superAdminRole = Role.builder().id(1L).name(ERole.SUPER_ADMIN).permissions(new HashSet<>()).build();
        when(roleRepository.findByName(ERole.SUPER_ADMIN)).thenReturn(Optional.of(superAdminRole));
        when(roleRepository.save(any(Role.class))).thenReturn(superAdminRole);

        CommandLineRunner runner = seeder.seedSuperAdmin(userService, userLookupService);
        runner.run(new String[]{});

        verify(userService).saveObject(any());
        verify(roleRepository).save(superAdminRole);
    }

    @Test
    void seedSuperAdmin_whenExistingAdmin_doesNotCreateAdmin() throws Exception {
        when(userLookupService.findByUsername("super-admin")).thenReturn(
                com.mikkytrionze.auth.user.domain.model.User.builder().id(1L).username("super-admin").build());
        when(permissionService.findByName(any(String.class))).thenReturn(Optional.empty());
        when(permissionService.saveObject(any(Permission.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roleService.findByName(any(ERole.class))).thenReturn(Optional.empty());
        when(roleService.saveObject(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        CommandLineRunner runner = seeder.seedSuperAdmin(userService, userLookupService);
        runner.run(new String[]{});

        verify(userService, never()).saveObject(any());
    }
}
