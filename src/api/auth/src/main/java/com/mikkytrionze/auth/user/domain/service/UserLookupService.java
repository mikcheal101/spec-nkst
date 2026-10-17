package com.mikkytrionze.auth.user.domain.service;

import com.mikkytrionze.auth.user.domain.model.User;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Service interface for retrieving user information.
 * Decouples security-related user lookups from the full business logic of UserService.
 */
public interface UserLookupService {

    /**
     * Retrieves the internal User domain model by username.
     *
     * @param username the username to search for
     * @return the User entity, or null if not found
     */
    User findByUsername(String username);

    /**
     * Retrieves the internal User domain model by user ID.
     *
     * @param userId the user ID to search for
     * @return the User entity, or null if not found
     */
    User findByUserId(Long userId);

    /**
     * Retrieves UserDetails for Spring Security authentication.
     * Used primarily by filters and authentication providers.
     *
     * @param username the username to search for
     * @return UserDetails populated with authorities/roles
     * @throws org.springframework.security.core.userdetails.UsernameNotFoundException if the user does not exist
     */
    UserDetails loadUserByUsername(String username);
}