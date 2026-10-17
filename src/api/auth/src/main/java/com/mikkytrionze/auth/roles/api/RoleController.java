package com.mikkytrionze.auth.roles.api;

import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.api.request.RoleRequest;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing system roles.
 * Provides endpoints for administrative retrieval, creation, modification, and deletion of roles.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    /**
     * Retrieves a list of all roles available in the system.
     * <p>
     * <b>Security:</b> Requires the {@code can_view_roles} authority.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('can_view_roles')")
    public ResponseEntity<List<RolesResponse>> fetchRoles() {
        log.info("Received request to fetch all system roles.");
        List<RolesResponse> roles = roleService.fetchRoles();

        log.info("Successfully retrieved {} roles.", roles.size());
        return ResponseEntity.ok(roles);
    }

    /**
     * Retrieves a specific role by its unique identifier.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('can_read_roles')")
    public ResponseEntity<RolesResponse> getRoleById(@PathVariable final Long id) {
        log.info("Fetching role details for ID: {}", id);
        RolesResponse response = roleService.getRoleById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates an existing system role.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('can_update_roles')")
    public ResponseEntity<RolesResponse> updateRole(@Valid @RequestBody RoleRequest request,
                                                    @PathVariable final Long id) {
        log.info("Updating role with ID: {}", id);
        RolesResponse response = roleService.updateRole(id, request);

        log.info("Successfully updated role ID: {}", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a system role by its unique identifier.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('can_delete_role')")
    public ResponseEntity<Void> deleteRole(@PathVariable final Long id) {
        log.info("Deleting role with ID: {}", id);
        roleService.deleteRole(id);

        log.info("Successfully deleted role ID: {}", id);
        return ResponseEntity.noContent().build();
    }
}
