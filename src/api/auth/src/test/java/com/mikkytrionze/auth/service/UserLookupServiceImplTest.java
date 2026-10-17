package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.user.application.service.UserLookupServiceImpl;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserLookupServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserLookupServiceImpl userLookupService;

    @Test
    void findByUsername_withExistingUser_returnsUser() {
        User user = User.builder().id(1L).username("test-user").build();
        when(userRepository.findByUsername("test-user")).thenReturn(Optional.of(user));

        User result = userLookupService.findByUsername("test-user");

        assertNotNull(result);
        assertEquals("test-user", result.getUsername());
    }

    @Test
    void findByUsername_withNonExistentUser_returnsNull() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        User result = userLookupService.findByUsername("nonexistent");

        assertNull(result);
    }

    @Test
    void findByUserId_withExistingUser_returnsUser() {
        User user = User.builder().id(1L).username("test-user").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        User result = userLookupService.findByUserId(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void findByUserId_withNonExistentUser_returnsNull() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        User result = userLookupService.findByUserId(99L);

        assertNull(result);
    }

    @Test
    void loadUserByUsername_withExistingUser_returnsUserDetails() {
        Permission perm = Permission.builder().id(1L).name("CAN_READ_CHURCH").build();
        Role role = Role.builder().id(1L).name(ERole.MEMBER_UNBAPTISED).permissions(Set.of(perm)).build();
        User user = User.builder()
                .id(1L)
                .username("test-user")
                .password("encoded-pw")
                .roles(Set.of(role))
                .build();

        when(userRepository.findByUsername("test-user")).thenReturn(Optional.of(user));

        UserDetails result = userLookupService.loadUserByUsername("test-user");

        assertNotNull(result);
        assertEquals("test-user", result.getUsername());
        assertEquals("encoded-pw", result.getPassword());
        assertFalse(result.getAuthorities().isEmpty());
        assertTrue(result.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("can_read_church")));
    }

    @Test
    void loadUserByUsername_withNoRoles_returnsUserDetailsWithEmptyAuthorities() {
        User user = User.builder()
                .id(1L)
                .username("test-user")
                .password("encoded-pw")
                .roles(new HashSet<>())
                .build();

        when(userRepository.findByUsername("test-user")).thenReturn(Optional.of(user));

        UserDetails result = userLookupService.loadUserByUsername("test-user");

        assertNotNull(result);
        assertTrue(result.getAuthorities().isEmpty());
    }

    @Test
    void loadUserByUsername_withNonExistentUser_throwsException() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> userLookupService.loadUserByUsername("nonexistent"));
    }

    @Test
    void loadUserByUsername_withMultipleRoles_mapsAllPermissions() {
        Permission perm1 = Permission.builder().id(1L).name("CAN_READ_CHURCH").build();
        Permission perm2 = Permission.builder().id(2L).name("CAN_WRITE_CHURCH").build();
        Role role1 = Role.builder().id(1L).name(ERole.MEMBER_UNBAPTISED).permissions(Set.of(perm1)).build();
        Role role2 = Role.builder().id(2L).name(ERole.ELDER).permissions(Set.of(perm2)).build();
        User user = User.builder()
                .id(1L)
                .username("multi-role-user")
                .password("encoded-pw")
                .roles(Set.of(role1, role2))
                .build();

        when(userRepository.findByUsername("multi-role-user")).thenReturn(Optional.of(user));

        UserDetails result = userLookupService.loadUserByUsername("multi-role-user");

        assertNotNull(result);
        assertEquals(2, result.getAuthorities().size());
    }
}
