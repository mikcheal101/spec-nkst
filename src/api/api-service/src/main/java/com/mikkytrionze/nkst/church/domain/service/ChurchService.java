package com.mikkytrionze.nkst.church.domain.service;

import com.mikkytrionze.nkst.church.api.request.ChurchRequest;
import com.mikkytrionze.nkst.church.api.response.ChurchResponse;
import com.mikkytrionze.nkst.church.domain.model.Church;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;

/**
 * Service interface for Church domain operations.
 * Handles lifecycle, retrieval, and business logic for Church entities.
 */
public interface ChurchService {

    /**
     * Retrieves a paginated view of all available churches.
     * @param pageable Pagination and sorting information (page number, size, sort).
     * @return A {@link Page} of {@link ChurchResponse} objects.
     */
    Page<ChurchResponse> getChurches(Pageable pageable);

    /**
     * Retrieves a paginated view of all available sub churches.
     * @param pageable Pagination and sorting information (page number, size, sort).
     * @return A {@link Page} of {@link ChurchResponse} objects.
     */
    Page<ChurchResponse> getSubChurches(final Long id, Pageable pageable);

    /**
     * Persists a new church record in the system.
     * @param churchRequest The DTO containing church registration details.
     * @return The created {@link ChurchResponse} including the generated ID.
     */
    ChurchResponse createChurch(ChurchRequest churchRequest);

    /**
     * Updates details of an existing church.
     * @param id The unique identifier of the church to update.
     * @param churchRequest The DTO containing the updated church information.
     * @return The updated {@link ChurchResponse}.
     */
    ChurchResponse updateChurch(final Long id, ChurchRequest churchRequest);

    /**
     * Fetches details for a specific church.
     * @param id The unique identifier of the target church.
     * @return The {@link ChurchResponse} matching the requested ID.
     */
    ChurchResponse getChurch(final Long id);

    /**
     * Internal utility to retrieve a domain entity.
     * @param id The unique identifier of the church.
     * @return The raw {@link Church} domain entity.
     * @throws ResourceNotFoundException if the entity does not exist.
     */
    Church findChurchById(final Long id);

    /**
     * Removes a church record from the system (Soft delete).
     * @param id The unique identifier of the church to be deleted.
     */
    void deleteChurch(Long id);
}