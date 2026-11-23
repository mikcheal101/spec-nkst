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
    private com.mikkytrionze.auth.user.domain.repository.UserRepository userRepository;

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
        org.mockito.Mockito.lenient().when(request.getHeader("X-Correlation-ID")).thenReturn("test-corr");
        org.mockito.Mockito.lenient().when(request.getRequestURI()).thenReturn("/test");
        org.mockito.Mockito.lenient().when(userRepository.findByUsername(any())).thenReturn(java.util.Optional.empty());
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
        var claims = io.jsonwebtoken.Jwts.claims().add("perm_epoch", 0).build();
        com.mikkytrionze.auth.user.domain.model.User user = com.mikkytrionze.auth.user.domain.model.User.builder()
                .id(1L).username(username).accountStatus(com.mikkytrionze.auth.user.domain.model.AccountStatus.ACTIVE).permissionEpoch(0L).build();

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateJwt(token)).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken(token)).thenReturn("jti-ok");
        when(tokenBlacklistService.isBlacklisted("jti-ok")).thenReturn(false);
        when(jwtUtil.getUsernameFromToken(token)).thenReturn(username);
        when(jwtUtil.getAllClaims(token)).thenReturn(claims);
        when(userRepository.findByUsername(username)).thenReturn(java.util.Optional.of(user));
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
    void doFilterInternal_withBlacklistedJwt_returns401AndDoesNotContinue() throws Exception {
        String token = "blacklisted-jwt";
        String jti = "compromised-jti";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(request.getRequestURI()).thenReturn("/api/v1/users");
        when(jwtUtil.validateJwt(token)).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken(token)).thenReturn(jti);
        when(tokenBlacklistService.isBlacklisted(jti)).thenReturn(true);
        java.io.PrintWriter writer = new java.io.PrintWriter(new java.io.StringWriter());
        when(response.getWriter()).thenReturn(writer);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(401);
        verify(filterChain, never()).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(userDetailsService, never()).loadUserByUsername(any());
    }

    @Test
    void doFilterInternal_withStalePermissionEpoch_returns401() throws Exception {
        String token = "stale-jwt";
        String username = "test-user";
        var claims = io.jsonwebtoken.Jwts.claims().add("perm_epoch", 1).build();
        com.mikkytrionze.auth.user.domain.model.User user = com.mikkytrionze.auth.user.domain.model.User.builder()
                .id(1L).username(username).accountStatus(com.mikkytrionze.auth.user.domain.model.AccountStatus.ACTIVE).permissionEpoch(2L).build();
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(request.getRequestURI()).thenReturn("/api/v1/users");
        when(jwtUtil.validateJwt(token)).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken(token)).thenReturn("jti-1");
        when(tokenBlacklistService.isBlacklisted("jti-1")).thenReturn(false);
        when(jwtUtil.getUsernameFromToken(token)).thenReturn(username);
        when(jwtUtil.getAllClaims(token)).thenReturn(claims);
        when(userRepository.findByUsername(username)).thenReturn(java.util.Optional.of(user));
        java.io.PrintWriter writer = new java.io.PrintWriter(new java.io.StringWriter());
        when(response.getWriter()).thenReturn(writer);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(401);
        verify(filterChain, never()).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_withMatchingPermissionEpoch_setsAuthentication() throws Exception {
        String token = "ok-jwt";
        String username = "test-user";
        var claims = io.jsonwebtoken.Jwts.claims().add("perm_epoch", 2).build();
        com.mikkytrionze.auth.user.domain.model.User user = com.mikkytrionze.auth.user.domain.model.User.builder()
                .id(1L).username(username).accountStatus(com.mikkytrionze.auth.user.domain.model.AccountStatus.ACTIVE).permissionEpoch(2L).build();
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(username, "password", Collections.emptyList());
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateJwt(token)).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken(token)).thenReturn("jti-2");
        when(tokenBlacklistService.isBlacklisted("jti-2")).thenReturn(false);
        when(jwtUtil.getUsernameFromToken(token)).thenReturn(username);
        when(jwtUtil.getAllClaims(token)).thenReturn(claims);
        when(userRepository.findByUsername(username)).thenReturn(java.util.Optional.of(user));
        when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
