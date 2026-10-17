package com.mikkytrionze.auth.controller;

import com.mikkytrionze.auth.roles.api.RoleController;
import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.api.request.RoleRequest;
import com.mikkytrionze.auth.roles.application.exception.RoleNotFoundException;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleControllerTest {

    @Mock
    private RoleService roleService;

    @InjectMocks
    private RoleController roleController;

    @Test
    void fetchRoles_returnsListOfRoles() {
        RolesResponse role1 = RolesResponse.builder().id(1L).name("MEMBER").build();
        RolesResponse role2 = RolesResponse.builder().id(2L).name("ADMIN").build();
        when(roleService.fetchRoles()).thenReturn(List.of(role1, role2));

        ResponseEntity<List<RolesResponse>> response = roleController.fetchRoles();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
        verify(roleService).fetchRoles();
    }

    @Test
    void fetchRoles_emptyList_returnsEmpty() {
        when(roleService.fetchRoles()).thenReturn(List.of());

        ResponseEntity<List<RolesResponse>> response = roleController.fetchRoles();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void getRoleById_withValidId_returnsRole() {
        RolesResponse response2 = RolesResponse.builder().id(1L).name("MEMBER").build();
        when(roleService.getRoleById(1L)).thenReturn(response2);

        ResponseEntity<RolesResponse> response = roleController.getRoleById(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("MEMBER", response.getBody().getName());
    }

    @Test
    void getRoleById_withInvalidId_throwsException() {
        when(roleService.getRoleById(99L)).thenThrow(new RoleNotFoundException(null));

        assertThrows(RoleNotFoundException.class, () -> roleController.getRoleById(99L));
    }

    @Test
    void updateRole_withValidRequest_returnsUpdatedRole() {
        RoleRequest request = RoleRequest.builder().name("MEMBER").permissions(List.of("CAN_READ")).build();
        RolesResponse updated = RolesResponse.builder().id(1L).name("MEMBER").build();
        when(roleService.updateRole(1L, request)).thenReturn(updated);

        ResponseEntity<RolesResponse> response = roleController.updateRole(request, 1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("MEMBER", response.getBody().getName());
    }

    @Test
    void updateRole_withInvalidId_throwsException() {
        RoleRequest request = RoleRequest.builder().name("MEMBER").permissions(List.of()).build();
        when(roleService.updateRole(99L, request)).thenThrow(new RoleNotFoundException(null));

        assertThrows(RoleNotFoundException.class, () -> roleController.updateRole(request, 99L));
    }

    @Test
    void deleteRole_withValidId_returnsNoContent() {
        doNothing().when(roleService).deleteRole(1L);

        ResponseEntity<Void> response = roleController.deleteRole(1L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(roleService).deleteRole(1L);
    }

    @Test
    void deleteRole_withInvalidId_throwsException() {
        doThrow(new RoleNotFoundException(null)).when(roleService).deleteRole(99L);

        assertThrows(RoleNotFoundException.class, () -> roleController.deleteRole(99L));
    }
}
