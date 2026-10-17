package com.mikkytrionze.auth.roles.domain.service;

import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.api.request.RoleRequest;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.role.application.dto.ERole;
import com.mikkytrionze.auth.common.domain.service.SaveAble;
import com.mikkytrionze.auth.common.domain.service.UpdateAble;

import java.util.List;
import java.util.Optional;

/**
 * Service interface defining core business logic and lifecycle operations for {@link Role} entities.
 * <p>
 * This interface extends {@link SaveAble} and {@link UpdateAble} to provide standard
 * persistence capabilities, while adding specific domain methods for role management.
 */
public interface RoleService extends SaveAble<Role>, UpdateAble<Role> {

    /**
     * Searches for a specific role in the system by its enum identifier.
     *
     * @param name The {@link ERole} representing the role type to search for.
     * @return An {@link Optional} containing the {@link Role} if found, or empty if not present.
     */
    Optional<Role> findByName(ERole name);

    /**
     * Retrieves all roles currently defined within the system, mapped into transport objects.
     *
     * @return A {@link List} of {@link RolesResponse} objects representing all system roles.
     * Returns an empty list if no roles are found.
     */
    List<RolesResponse> fetchRoles();

    /**
     * Retrieves a specific role by its unique identifier.
     *
     * @param id The ID of the role to retrieve.
     * @return The {@link RolesResponse} associated with the provided ID.
     */
    RolesResponse getRoleById(Long id);

    /**
     * Updates an existing role with new details.
     *
     * @param id The ID of the role to update.
     * @param request The {@link RoleRequest} containing the updated information.
     * @return The updated {@link RolesResponse}.
     */
    RolesResponse updateRole(Long id, RoleRequest request);

    /**
     * Deletes a role from the system by its unique identifier.
     *
     * @param id The ID of the role to be removed.
     */
    void deleteRole(Long id);
}
