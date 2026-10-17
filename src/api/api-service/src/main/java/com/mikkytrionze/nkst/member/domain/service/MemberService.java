package com.mikkytrionze.nkst.member.domain.service;

import com.mikkytrionze.nkst.member.api.request.MemberRequest;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Member domain operations.
 * Handles lifecycle, retrieval, and business logic for Member entities.
 */
public interface MemberService {

    /**
     * Performs a soft-delete of the member identified by ID.
     *
     * @param id The unique identifier of the member to be removed.
     */
    void deleteMember(final Long id);

    /**
     * Retrieves the details of a specific member.
     *
     * @param id The unique identifier of the member.
     * @return The {@link MemberResponse} matching the requested ID.
     */
    MemberResponse getById(final Long id);

    /**
     * Retrieves the details of a specific member.
     *
     * @param id The unique identifier of the member.
     * @return The {@link Member} matching the requested ID.
     */
    Member findMemberById(final Long id);

    /**
     * Persists a new member record in the system.
     *
     * @param memberRequest The MemberRequest entity to be saved.
     * @return The saved {@link MemberResponse} including the generated ID.
     */
    MemberResponse saveMember(MemberRequest memberRequest);
    /**
     * Registers a new member with the provided registration data.
     * Validates baptismal number uniqueness against Member.tel.
     * Creates BaptismRecord when isBaptised=true.
     *
     * @param baptismalNumber The baptismal number to validate and store
     * @param isBaptised Whether the member is baptized
     * @param churchId The church ID
     * @return The saved MemberResponse
     */
    MemberResponse registerMember(String baptismalNumber, Boolean isBaptised, Long churchId);



    /**
     * Updates information for an existing member.
     *
     * @param id The unique identifier of the member to update.
     * @param member The Member entity containing the updated details.
     * @return The updated {@link MemberResponse}.
     */
    MemberResponse updateMember(final Long id, UpdateMemberRequest member);

    /**
     * Retrieves a paginated view of all the members.
     *
     * @param pageable Pagination and sorting info.
     * @return A {@link Page} of {@link MemberResponse} objects.
     */
    Page<MemberResponse> getAllMembers(Pageable pageable);

    /**
     * Retrieves a paginated view of members from a church.
     *
     * @param churchId The unique identifier of the church to fetch from.
     * @param pageable Pagination and sorting info.
     * @return A {@link Page} of {@link MemberResponse} objects.
     */
    Page<MemberResponse> getAllChurchMembers(final Long churchId, Pageable pageable);

    /**
     * Retrieves a details of a specific church
     * @param churchId The church unique identifier.
     * @param memberId The member unique identifier.
     * @return The {@link MemberResponse} matching the requested ids.
     */
    MemberResponse getChurchMember(final Long churchId, final Long memberId);

    /**
     * Fetches all the members that are prospective church admins.
     * @param churchId - The church which requires the admin.
     * @param pageable Pagination.
     * @return The {@link Page} of {@link MemberResponse}.
     */
    Page<MemberResponse> fetchProspectiveAdmins(final Long churchId, Pageable pageable);

    /**
     * Processes an event triggered when a user's information has been updated
     * in the identity or authentication system, ensuring the local member record
     * is synchronized with these changes.
     *
     * @param userUpdatedEvent the event object containing the updated user information
     */
    void processUserUpdatedEvent(UserUpdatedEvent userUpdatedEvent);

    /**
     * Searches for members based on a provided query string (e.g., name or contact details)
     * and returns a paginated list of matching records.
     *
     * @param query    the search term to match against member attributes
     * @param pageable pagination and sorting information
     * @return a {@link Page} of {@link MemberResponse} objects matching the search criteria
     */
    Page<MemberResponse> searchMembers(String query, Pageable pageable);
}
