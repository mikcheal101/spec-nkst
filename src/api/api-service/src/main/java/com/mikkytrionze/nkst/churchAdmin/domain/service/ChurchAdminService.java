package com.mikkytrionze.nkst.churchAdmin.domain.service;

/**
 * Service interface for managing church administrative roles.
 * Handles the logic required to promote or assign users to administrative positions.
 */
public interface ChurchAdminService {

    /**
     * Assigns administrative privileges to a user for a specific church.
     *
     * @param memberId the unique identifier of the member to be promoted
     *                 to an administrative role
     * @return true if the administrator was successfully set, false otherwise
     */
    Boolean setChurchAdmin(Long memberId);

    /**
     * Checks whether the specified church currently has an administrative
     * user assigned.
     *
     * @param churchId the unique identifier of the church to check
     * @return true if an administrator is currently assigned to the church,
     *         false otherwise
     */
    Boolean churchHasAdmin(Long churchId);
}
