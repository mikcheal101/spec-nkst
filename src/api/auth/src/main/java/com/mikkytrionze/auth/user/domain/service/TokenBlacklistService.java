package com.mikkytrionze.auth.user.domain.service;

/**
 * Service interface for managing JWT revocation via a blacklist strategy.
 * Prevents unauthorized access by tracking tokens invalidated before their natural expiry.
 */
public interface TokenBlacklistService {

    /**
     * Adds a token's unique identifier to the blacklist until its expiration.
     *
     * @param jti The JWT ID (unique identifier) of the token to be revoked.
     * @param ttlMillis The Time-To-Live in milliseconds until the token would have expired.
     */
    void blacklist(String jti, long ttlMillis);

    /**
     * Checks if a token's unique identifier has been revoked.
     *
     * @param jti The JWT ID to verify against the blacklist.
     * @return true if the token is blacklisted, false if it is valid.
     */
    boolean isBlacklisted(String jti);
}