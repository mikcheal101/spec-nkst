package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.user.application.service.UserDetailsServiceImpl;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserLookupService userLookupService;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void loadUserByUsername_delegatesToUserLookupService() {
        UserDetails expected = new org.springframework.security.core.userdetails.User(
                "test-user", "password", Collections.emptyList());
        when(userLookupService.loadUserByUsername("test-user")).thenReturn(expected);

        UserDetails result = userDetailsService.loadUserByUsername("test-user");

        assertEquals(expected, result);
        verify(userLookupService).loadUserByUsername("test-user");
    }

    @Test
    void loadUserByUsername_withNonExistentUser_throwsException() {
        when(userLookupService.loadUserByUsername("nonexistent"))
                .thenThrow(new UsernameNotFoundException("User not found"));

        assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("nonexistent"));
    }
}
