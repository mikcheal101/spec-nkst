package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.roles.application.service.PermissionServiceImpl;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionServiceImplTest {

    @Mock
    private PermissionRepository permissionRepository;

    @InjectMocks
    private PermissionServiceImpl permissionService;

    @Test
    void saveObject_withNullPermission_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> permissionService.saveObject(null));
    }

    @Test
    void saveObject_withNewPermission_savesAndFlushes() {
        Permission permission = Permission.builder().name("CAN_READ_CHURCH").build();
        when(permissionRepository.findByName("CAN_READ_CHURCH")).thenReturn(Optional.empty());
        when(permissionRepository.saveAndFlush(any(Permission.class))).thenReturn(permission);

        Permission result = permissionService.saveObject(permission);

        assertNotNull(result);
        verify(permissionRepository).saveAndFlush(permission);
    }

    @Test
    void saveObject_withExistingPermission_returnsExisting() {
        Permission existing = Permission.builder().id(1L).name("CAN_READ_CHURCH").build();
        Permission newPerm = Permission.builder().name("CAN_READ_CHURCH").build();

        when(permissionRepository.findByName("CAN_READ_CHURCH")).thenReturn(Optional.of(existing));

        Permission result = permissionService.saveObject(newPerm);

        assertEquals(existing, result);
        verify(permissionRepository, never()).saveAndFlush(any());
    }

    @Test
    void findByName_delegatesToRepository() {
        Permission permission = Permission.builder().id(1L).name("CAN_READ_CHURCH").build();
        when(permissionRepository.findByName("CAN_READ_CHURCH")).thenReturn(Optional.of(permission));

        Optional<Permission> result = permissionService.findByName("CAN_READ_CHURCH");

        assertTrue(result.isPresent());
        assertEquals("CAN_READ_CHURCH", result.get().getName());
    }

    @Test
    void findByName_withNonExistentName_returnsEmpty() {
        when(permissionRepository.findByName("NON_EXISTENT")).thenReturn(Optional.empty());

        Optional<Permission> result = permissionService.findByName("NON_EXISTENT");

        assertFalse(result.isPresent());
    }
}
