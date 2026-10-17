package com.mikkytrionze.auth.user.domain.service;

import com.mikkytrionze.auth.user.api.request.RefreshTokenRequest;
import com.mikkytrionze.auth.user.api.response.RefreshTokenResponse;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;

/**
 * Service interface for managing OAuth2-style refresh token lifecycles.
 * Handles token generation, validation, and session extension workflows.
 */
public interface RefreshTokenService {

    /**
     * Generates and persists a new refresh token for the specified user.
     *
     * @param username The identifier of the user for whom the token is generated.
     * @return The newly created {@link RefreshToken} entity.
     */
    RefreshToken createRefreshToken(String username);

    /**
     * Checks if the provided token has passed its expiration date.
     *
     * @param refreshToken The {@link RefreshToken} entity to validate.
     * @return true if the token is expired, false otherwise.
     */
    Boolean isTokenExpired(RefreshToken refreshToken);

    /**
     * Validates a request for a token refresh and issues a new access token.
     *
     * @param refreshTokenRequest The DTO containing the current refresh token string.
     * @return A {@link RefreshTokenResponse} containing the new access and refresh tokens.
     */
    RefreshTokenResponse getRefreshToken(RefreshTokenRequest refreshTokenRequest);
}
