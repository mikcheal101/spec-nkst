package com.mikkytrionze.nkst.pastor.domain.service;

import com.mikkytrionze.nkst.pastor.api.response.PastorResponse;
import com.mikkytrionze.nkst.pastor.api.request.PastorRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Pastor domain operations.
 * Handles lifecycle, retrieval, and business logic for Pastor entities.
 */
public interface PastorService {

    /**
     * Retrieves the details of a specific pastor.
     *
     * @param id The unique identifier of the pastor.
     * @return The {@link PastorResponse} matching the requested ID.
     */
    PastorResponse getPastorById(Long id);

    /**
     * Retrieves a paginated list of all active pastors.
     *
     * @param pageable Pagination and sorting information.
     * @return A {@link Page} of {@link PastorResponse} objects.
     */
    Page<PastorResponse> getPastors(Pageable pageable);

    /**
     * Performs a soft-delete of the pastor identified by ID.
     *
     * @param id The unique identifier of the pastor to be removed.
     */
    void deletePastorById(Long id);

    /**
     * Persists a new pastor record in the system.
     *
     * @param pastorRequest The DTO containing the pastor's registration details.
     * @return The created {@link PastorResponse} including the generated ID.
     */
    PastorResponse createPastor(PastorRequest pastorRequest);

    /**
     * Updates information for an existing pastor.
     *
     * @param id The unique identifier of the pastor to update.
     * @param pastorRequest The DTO containing the updated pastor details.
     * @return The updated {@link PastorResponse}.
     */
    PastorResponse updatePastor(Long id, PastorRequest pastorRequest);
}
