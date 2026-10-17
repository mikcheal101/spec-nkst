package com.mikkytrionze.nkst.pastor.domain.service;

import com.mikkytrionze.nkst.pastor.api.response.PastorRoleResponse;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for managing Pastor roles and responsibilities.
 * Facilitates the retrieval of role definitions within the organization.
 */
public interface PastorRoleService {

    /**
     * Retrieves the details of a specific pastor role by its identifier.
     * @param id The unique identifier of the pastor role.
     * @return The {@link PastorRoleResponse} containing role information.
     */
    PastorRoleResponse getPastorRole(Long id);

    /**
     * Retrieves the details of a specific pastor role by its identifier.
     * @param id The unique identifier of the pastor role.
     * @return The {@link PastorRole} containing role information.
     */
    PastorRole findPastorRole(Long id);

    /**
     * Retrieves a paginated list of all defined pastor roles.
     * @param pageable Pagination and sorting information.
     * @return A {@link Page} of {@link PastorRoleResponse} objects.
     */
    Page<PastorRoleResponse> getPastorRoles(Pageable pageable);
}
