package com.mikkytrionze.nkst.deacon.domain.service;

import com.mikkytrionze.nkst.deacon.api.request.MakeDeaconRequest;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;

/**
 * Service interface for managing church deacons.
 * Handles the retrieval, search, and promotion processes for deacons scoped by church.
 */
public interface DeaconService {

    /**
     * Retrieves a paginated list of all members currently serving as deacons
     * within the user's church.
     *
     * @param pageable the pagination and sorting information
     * @return a {@link Page} of {@link MemberResponse} objects representing the deacons
     */
    Page<MemberResponse> fetchDeacons(Pageable pageable);

    /**
     * Searches for regular members who are eligible to be promoted or considered
     * for the deacon position (excluding existing deacons), using a search query and pagination.
     *
     * @param query    the search string to filter members by name, email, or other criteria
     * @param pageable the pagination and sorting information
     * @return a {@link Page} of {@link MemberResponse} objects representing the matching prospective candidates
     */
    Page<MemberResponse> searchProspectiveDeacons(final String query, Pageable pageable);

    /**
     * Retrieves the details of a specific deacon within the church by their unique identifier.
     *
     * @param id the unique identifier of the deacon record
     * @return a {@link MemberResponse} containing the details of the deacon
     * @throws ResourceNotFoundException if no deacon is found with the provided ID
     */
    MemberResponse getDeacon(final Long id);

    /**
     * Promotes a member to the role of a deacon based on the provided request details.
     *
     * @param makeDeaconRequest the request object containing member identification
     *                          and promotion details
     * @return {@code true} if the member was successfully promoted, {@code false} otherwise
     */
    Boolean createDeacon(final MakeDeaconRequest makeDeaconRequest);

    /**
     * Updates the information of an existing deacon.
     *
     * @param id            the unique identifier of the deacon to be updated
     * @param deaconRequest the request object containing the updated member details
     * @return a {@link MemberResponse} containing the updated deacon information
     * @throws ResourceNotFoundException if no deacon is found with the provided ID
     */
    MemberResponse updateDeacon(final Long id, final UpdateMemberRequest deaconRequest);
}
