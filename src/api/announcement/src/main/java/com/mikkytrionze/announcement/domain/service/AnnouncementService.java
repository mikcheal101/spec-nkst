package com.mikkytrionze.announcement.domain.service;

import com.mikkytrionze.announcement.api.request.CreateAnnouncementRequest;
import com.mikkytrionze.announcement.api.request.UpdateAnnouncementRequest;
import com.mikkytrionze.announcement.api.response.AnnouncementResponse;
import org.springframework.data.domain.Page;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.springframework.data.domain.Pageable;


/**
 * Service interface for managing announcement operations.
 */
public interface AnnouncementService {

    /**
     * Retrieves a paginated list of announcements.
     *
     * @param pageable pagination information
     * @return a page of {@link AnnouncementResponse}
     */
    Page<AnnouncementResponse> fetchAnnouncements(Pageable pageable);

    /**
     * Finds a specific announcement by its unique identifier.
     *
     * @param id the announcement ID
     * @return the {@link AnnouncementResponse}
     * @throws ResourceNotFoundException if the announcement does not exist
     */
    AnnouncementResponse findById(Long id) throws ResourceNotFoundException;

    /**
     * Creates a new announcement for the authenticated user's church.
     *
     * @param request the {@link CreateAnnouncementRequest} containing announcement details
     * @return the created {@link AnnouncementResponse}
     */
    AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request);

    /**
     * Updates an existing announcement.
     *
     * @param id      the announcement ID to update
     * @param request the {@link UpdateAnnouncementRequest} containing updated details
     * @return the updated {@link AnnouncementResponse}
     * @throws ResourceNotFoundException if the announcement does not exist
     */
    AnnouncementResponse updateAnnouncement(Long id, UpdateAnnouncementRequest request) throws ResourceNotFoundException;

    /**
     * Deletes (or marks as deleted) an announcement by its ID.
     *
     * @param id the announcement ID
     * @throws ResourceNotFoundException if the announcement does not exist
     */
    void deleteAnnouncement(Long id) throws ResourceNotFoundException;
}