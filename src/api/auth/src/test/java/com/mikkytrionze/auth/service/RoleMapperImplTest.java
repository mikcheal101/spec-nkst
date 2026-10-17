package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.roles.api.Response.PermissionResponse;
import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.application.mapper.PermissionMapperImpl;
import com.mikkytrionze.auth.roles.application.mapper.RoleMapperImpl;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class RoleMapperImplTest {

    private RoleMapperImpl roleMapper;
    private PermissionMapperImpl permissionMapper;

    @BeforeEach
    void setUp() {
        permissionMapper = new PermissionMapperImpl();
        roleMapper = new RoleMapperImpl();
        ReflectionTestUtils.setField(roleMapper, "permissionMapper", permissionMapper);
    }

    @Test
    void toResponse_withRoleAndPermissions_returnsMappedResponse() {
        Permission perm = Permission.builder().id(1L).name("CAN_READ_CHURCH").build();
        Role role = Role.builder()
                .id(1L)
                .name(ERole.MEMBER_UNBAPTISED)
                .permissions(new HashSet<>(Set.of(perm)))
                .build();

        RolesResponse response = roleMapper.toResponse(role);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("MEMBER_UNBAPTISED", response.getName());
        assertNotNull(response.getPermissions());
        assertEquals(1, response.getPermissions().size());
        assertEquals("CAN_READ_CHURCH", response.getPermissions().get(0).getName());
    }

    @Test
    void toResponse_withRoleAndNoPermissions_returnsEmptyPermissions() {
        Role role = Role.builder()
                .id(2L)
                .name(ERole.SUPER_ADMIN)
                .permissions(new HashSet<>())
                .build();

        RolesResponse response = roleMapper.toResponse(role);

        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertEquals("SUPER_ADMIN", response.getName());
        assertNotNull(response.getPermissions());
        assertTrue(response.getPermissions().isEmpty());
    }

    @Test
    void toResponse_withNullRole_returnsNull() {
        assertNull(roleMapper.toResponse(null));
    }

    @Test
    void toResponse_withNullPermissions_returnsNullPermissions() {
        Role role = Role.builder()
                .id(3L)
                .name(ERole.ELDER)
                .permissions(null)
                .build();

        RolesResponse response = roleMapper.toResponse(role);

        assertNotNull(response);
        assertNull(response.getPermissions());
    }

    @Test
    void permissionMapper_toResponse_withPermission_returnsMappedResponse() {
        Permission perm = Permission.builder().id(5L).name("CAN_WRITE_CHURCH").build();

        PermissionResponse response = permissionMapper.toResponse(perm);

        assertNotNull(response);
        assertEquals(5L, response.getId());
        assertEquals("CAN_WRITE_CHURCH", response.getName());
    }

    @Test
    void permissionMapper_toResponse_withNull_returnsNull() {
        assertNull(permissionMapper.toResponse(null));
    }
}
