package com.mikkytrionze.nkst.elder.domain.service;

import com.mikkytrionze.nkst.elder.api.request.MakeElderRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;

/**
 * Service interface for managing church elders.
 * Handles the retrieval of elder information and administrative lists scoped by church.
 */
public interface ElderService {

    /**
     * Retrieves a paginated list of all members currently serving as elders
     * within a specific church.
     *
     * @param pageable the pagination and sorting information
     * @return a {@link Page} of {@link MemberResponse} objects representing the elders
     */
    Page<MemberResponse> getElders(Pageable pageable);

    /**
     * Retrieves the details of a specific elder within a church by their unique identifier.
     *
     * @param id       the unique identifier of the elder
     * @return a {@link MemberResponse} containing the details of the elder
     * @throws ResourceNotFoundException if no elder
     *         is found with the provided ID within the specified church
     */
    MemberResponse getElder(Long id);

    /**
     * Promotes a member to the role of an elder based on the provided request details.
     *
     * @param makeElderRequest the request object containing member identification
     *        and promotion details
     * @return {@code true} if the member was successfully promoted, {@code false} otherwise
     */
    Boolean makeElder(MakeElderRequest makeElderRequest);

    /**
     * Searches for regular members who are eligible to be promoted or considered
     * for the elder position, using a search query and pagination.
     *
     * @param query    the search string to filter members by name, email, or other criteria
     * @param pageable the pagination and sorting information
     * @return a {@link Page} of {@link MemberResponse} objects representing the matching eligible candidates
     */
    Page<MemberResponse> searchEligibleMembersForElder(String query, Pageable pageable);
}