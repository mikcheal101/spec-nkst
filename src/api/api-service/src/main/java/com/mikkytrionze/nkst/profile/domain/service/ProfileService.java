package com.mikkytrionze.nkst.profile.domain.service;

import com.mikkytrionze.nkst.profile.api.request.ProfileRequest;
import com.mikkytrionze.nkst.profile.api.response.ProfileResponse;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;

/**
 * Service interface for managing user profile operations.
 * Handles the retrieval and management of authenticated user profile details.
 */
public interface ProfileService {

    /**
     * Retrieves the profile information for the currently authenticated user.
     *
     * @return a {@link ProfileResponse} containing the user's profile details
     * @throws ResourceNotFoundException if the user profile cannot be found
     */
    ProfileResponse getProfile();

    /**
     * Updates the profile information for the currently authenticated user.
     *
     * @param request the {@link ProfileRequest} object containing the updated profile details
     * @return a {@link ProfileResponse} containing the newly updated profile information
     * @throws ResourceNotFoundException if the authenticated user profile cannot be found
     */
    ProfileResponse updateProfile(ProfileRequest request);
}