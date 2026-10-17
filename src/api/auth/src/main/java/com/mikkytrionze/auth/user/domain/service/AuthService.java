package com.mikkytrionze.auth.user.domain.service;

import com.mikkytrionze.auth.user.api.request.SignInRequest;
import com.mikkytrionze.auth.user.api.request.SignOutRequest;
import com.mikkytrionze.auth.user.api.request.SignupRequest;
import com.mikkytrionze.auth.user.api.response.SignInResponse;

/**
 * Service interface for handling authentication and user identity workflows.
 * Manages user registration, session authentication, and logout procedures.
 */
public interface AuthService {

    /**
     * Validates user credentials and generates an authentication token and refresh token.
     *
     * @param signInRequest The DTO containing username and password.
     * @return A {@link SignInResponse} containing the access and refresh tokens.
     */
    SignInResponse authenticateUser(SignInRequest signInRequest);

    /**
     * Registers a new user account in the system.
     *
     * @param signupRequest The DTO containing registration credentials and profile data.
     * @return true if the registration was successful, false otherwise.
     */
    Boolean registerUser(SignupRequest signupRequest);

    /**
     * Invalidates the current user session and clears authentication tokens.
     *
     * @param signOutRequest The DTO containing the token or session identifier to be revoked.
     * @return true if the logout operation completed successfully, false otherwise.
     */
    Boolean logOutUser(SignOutRequest signOutRequest);
}
