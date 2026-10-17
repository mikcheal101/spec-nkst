package com.mikkytrionze.auth.roles.domain.service;

import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.common.domain.service.SaveAble;

import java.util.Optional;

/**
 * Service interface defining business logic and lifecycle operations for {@link Permission} entities.
 * <p>
 * This interface extends {@link SaveAble} to support standard persistence operations
 * and provides domain-specific lookups for granular permission management.
 */
public interface PermissionService extends SaveAble<Permission> {

    /**
     * Searches for a specific permission in the system by its unique name.
     *
     * @param name The string identifier of the permission (e.g., "CAN_CREATE_PROJECTS").
     * @return An {@link Optional} containing the {@link Permission} if found, or empty if not present.
     */
    Optional<Permission> findByName(String name);
}
