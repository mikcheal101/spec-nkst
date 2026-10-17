package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.api.request.RoleRequest;
import com.mikkytrionze.auth.roles.application.exception.RoleNotFoundException;
import com.mikkytrionze.auth.roles.application.mapper.RoleMapper;
import com.mikkytrionze.auth.roles.application.service.RoleServiceImpl;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private RoleServiceImpl roleService;

    private Role role;

    @BeforeEach
    void setUp() {
        role = Role.builder().id(1L).name(ERole.MEMBER_UNBAPTISED).permissions(new HashSet<>()).build();
    }

    @Test
    void saveObject_withNullRole_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> roleService.saveObject(null));
    }

    @Test
    void saveObject_withNewRole_savesAndFlushes() {
        when(roleRepository.findByName(ERole.MEMBER_UNBAPTISED)).thenReturn(Optional.empty());
        when(roleRepository.saveAndFlush(any(Role.class))).thenReturn(role);

        Role result = roleService.saveObject(role);

        assertNotNull(result);
        verify(roleRepository).saveAndFlush(role);
    }

    @Test
    void saveObject_withExistingRole_updatesPermissions() {
        Role existingRole = Role.builder().id(1L).name(ERole.MEMBER_UNBAPTISED).permissions(new HashSet<>()).build();
        Permission perm = Permission.builder().id(10L).name("CAN_READ").build();
        role.getPermissions().add(perm);

        when(roleRepository.findByName(ERole.MEMBER_UNBAPTISED)).thenReturn(Optional.of(existingRole));
        when(roleRepository.save(any(Role.class))).thenReturn(existingRole);

        Role result = roleService.saveObject(role);

        assertNotNull(result);
        verify(roleRepository).save(existingRole);
        verify(roleRepository, never()).saveAndFlush(any());
    }

    @Test
    void updateObject_withNullRole_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> roleService.updateObject(null));
    }

    @Test
    void updateObject_withExistingName_saves() {
        when(roleRepository.findByName(ERole.MEMBER_UNBAPTISED)).thenReturn(Optional.of(role));
        when(roleRepository.save(any(Role.class))).thenReturn(role);

        Role result = roleService.updateObject(role);

        assertNotNull(result);
        verify(roleRepository).save(role);
    }

    @Test
    void updateObject_withNonExistingName_returnsRole() {
        when(roleRepository.findByName(ERole.MEMBER_UNBAPTISED)).thenReturn(Optional.empty());

        Role result = roleService.updateObject(role);

        assertEquals(role, result);
        verify(roleRepository, never()).save(any());
    }

    @Test
    void findByName_delegatesToRepository() {
        when(roleRepository.findByName(ERole.MEMBER_UNBAPTISED)).thenReturn(Optional.of(role));

        Optional<Role> result = roleService.findByName(ERole.MEMBER_UNBAPTISED);

        assertTrue(result.isPresent());
        assertEquals(role, result.get());
    }

    @Test
    void fetchRoles_returnsMappedList() {
        RolesResponse response = RolesResponse.builder().id(1L).name("MEMBER_UNBAPTISED").build();
        when(roleRepository.findAll()).thenReturn(List.of(role));
        when(roleMapper.toResponse(role)).thenReturn(response);

        List<RolesResponse> result = roleService.fetchRoles();

        assertEquals(1, result.size());
        verify(roleMapper).toResponse(role);
    }

    @Test
    void getRoleById_withValidId_returnsRole() {
        RolesResponse response = RolesResponse.builder().id(1L).name("MEMBER_UNBAPTISED").build();
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(roleMapper.toResponse(role)).thenReturn(response);

        RolesResponse result = roleService.getRoleById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getRoleById_withInvalidId_throwsException() {
        when(roleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RoleNotFoundException.class, () -> roleService.getRoleById(99L));
    }

    @Test
    void updateRole_withValidId_updatesPermissions() {
        RoleRequest request = RoleRequest.builder()
                .name("MEMBER_UNBAPTISED")
                .permissions(List.of("CAN_READ"))
                .build();
        Permission perm = Permission.builder().id(10L).name("CAN_READ").build();
        RolesResponse response = RolesResponse.builder().id(1L).name("MEMBER_UNBAPTISED").build();

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionService.findByName("CAN_READ")).thenReturn(Optional.of(perm));
        when(roleRepository.save(any(Role.class))).thenReturn(role);
        when(roleMapper.toResponse(role)).thenReturn(response);

        RolesResponse result = roleService.updateRole(1L, request);

        assertNotNull(result);
        verify(roleRepository).save(role);
    }

    @Test
    void updateRole_withInvalidId_throwsException() {
        RoleRequest request = RoleRequest.builder()
                .name("MEMBER_UNBAPTISED")
                .permissions(List.of())
                .build();

        when(roleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RoleNotFoundException.class, () -> roleService.updateRole(99L, request));
    }

    @Test
    void updateRole_withNonExistentPermission_filtersIt() {
        RoleRequest request = RoleRequest.builder()
                .name("MEMBER_UNBAPTISED")
                .permissions(List.of("NON_EXISTENT_PERM"))
                .build();
        RolesResponse response = RolesResponse.builder().id(1L).name("MEMBER_UNBAPTISED").build();

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionService.findByName("NON_EXISTENT_PERM")).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenReturn(role);
        when(roleMapper.toResponse(role)).thenReturn(response);

        RolesResponse result = roleService.updateRole(1L, request);

        assertNotNull(result);
        assertTrue(role.getPermissions().isEmpty());
    }

    @Test
    void deleteRole_withValidId_deletes() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));

        roleService.deleteRole(1L);

        verify(roleRepository).delete(role);
    }

    @Test
    void deleteRole_withInvalidId_throwsException() {
        when(roleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RoleNotFoundException.class, () -> roleService.deleteRole(99L));
    }

    @Test
    void roleNotFoundException_withNonNullMessage_usesProvidedMessage() {
        RoleNotFoundException exception = new RoleNotFoundException("Custom message");

        assertEquals("Custom message", exception.getMessage());
    }

    @Test
    void roleNotFoundException_withNullMessage_usesDefaultMessage() {
        RoleNotFoundException exception = new RoleNotFoundException(null);

        assertEquals("Role Not found!", exception.getMessage());
    }
}
