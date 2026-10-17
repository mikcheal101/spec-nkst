package com.mikkytrionze.nkst.member.domain.service;

import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;

/**
 * Service interface for BaptismRecord domain operations.
 * Handles lifecycle, retrieval, and business logic for BaptismRecord entities.
 */
public interface BaptismRecordService {

    /**
     * Performs a soft-delete of the baptism record identified by ID.
     *
     * @param id The unique identifier of the baptism record to be removed.
     */
    void delete(Long id);

    /**
     * Retrieves the details of a specific baptism record.
     *
     * @param id The unique identifier of the baptism record.
     * @return The {@link BaptismRecord} matching the requested ID.
     */
    BaptismRecord getById(Long id);

    /**
     * Persists a new baptism record in the system.
     *
     * @param baptismRecord The BaptismRecord entity to be saved.
     * @return The saved {@link BaptismRecord} including the generated ID.
     */
    BaptismRecord save(BaptismRecord baptismRecord);

    /**
     * Updates information for an existing baptism record.
     *
     * @param id The unique identifier of the baptism record to update.
     * @param baptismRecord The BaptismRecord entity containing the updated details.
     * @return The updated {@link BaptismRecord}.
     */
    BaptismRecord update(Long id, BaptismRecord baptismRecord);
}
