package com.mikkytrionze.auth.security;

import com.mikkytrionze.auth.user.infrastructure.security.AuthTokenFilter;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import com.mikkytrionze.auth.user.domain.service.TokenBlacklistService;
import org.springframework.security.core.userdetails.UserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthTokenFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private AuthTokenFilter authTokenFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_withNoAuthHeader_passesThrough() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_withValidJwt_setsAuthentication() throws Exception {
        String token = "valid-jwt-token";
        String username = "test-user";
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                username, "password", Collections.emptyList());

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateJwt(token)).thenReturn(true);
        when(jwtUtil.getUsernameFromToken(token)).thenReturn(username);
        when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(username, SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void doFilterInternal_withInvalidJwt_doesNotSetAuthentication() throws Exception {
        String token = "invalid-jwt-token";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateJwt(token)).thenReturn(false);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_whenExceptionOccurs_logsAndContinues() throws Exception {
        String token = "some-jwt-token";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateJwt(token)).thenThrow(new RuntimeException("Unexpected error"));

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_withBearerWithoutSpace_passesThrough() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearerno-space");

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_withBlacklistedJwt_doesNotSetAuthentication() throws Exception {
        String token = "blacklisted-jwt";
        String jti = "compromised-jti";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateJwt(token)).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken(token)).thenReturn(jti);
        when(tokenBlacklistService.isBlacklisted(jti)).thenReturn(true);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtUtil).validateJwt(token);
        verify(jwtUtil).getTokenIdFromToken(token);
        verify(tokenBlacklistService).isBlacklisted(jti);
        verify(jwtUtil, never()).getUsernameFromToken(token);
        verify(userDetailsService, never()).loadUserByUsername(any());
    }
}
