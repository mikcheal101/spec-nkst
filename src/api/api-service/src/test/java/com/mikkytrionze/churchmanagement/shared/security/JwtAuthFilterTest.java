package com.mikkytrionze.churchmanagement.shared.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    private JwtAuthFilter filter;

    @Mock
    private com.mikkytrionze.churchmanagement.shared.security.TokenRevocationService revocationService;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthFilter(jwtUtil, revocationService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldReturnNull_whenNoAuthorizationHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertNull(filter.extracStringToken(request));
    }

    @Test
    void shouldReturnNull_whenNonBearerHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic abc");

        assertNull(filter.extracStringToken(request));
    }

    @Test
    void shouldExtractTokenFromBearerHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer abc123");

        assertEquals("abc123", filter.extracStringToken(request));
    }

    @Test
    void shouldProceedWithoutSettingAuthentication_whenNoToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertSame(request, chain.getRequest());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldSetAuthentication_whenTokenIsValid() throws Exception {
        when(jwtUtil.validateJwt("tok")).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken("tok")).thenReturn("jti-1");
        when(revocationService.isBlacklisted("jti-1")).thenReturn(false);
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.claims().add("uid", 1).add("perm_epoch", 2).build();
        when(jwtUtil.getAllClaims("tok")).thenReturn(claims);
        when(revocationService.isEpochStale(1L, 2L)).thenReturn(false);
        when(jwtUtil.getSubject("tok")).thenReturn("user1");
        when(jwtUtil.getClaim(eq("tok"), eq("authorities"), eq(List.class)))
                .thenReturn(List.of("ROLE_ADMIN"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertSame(request, chain.getRequest());
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertEquals("user1", authentication.getName());
        assertTrue(authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void shouldNotSetAuthentication_whenTokenIsInvalid() throws Exception {
        when(jwtUtil.validateJwt("tok")).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertNull(chain.getRequest());
        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtUtil, never()).getSubject(anyString());
        verify(jwtUtil, never()).getClaim(anyString(), anyString(), any(Class.class));
    }

    @Test
    void shouldReturn401_whenTokenBlacklisted() throws Exception {
        when(jwtUtil.validateJwt("tok")).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken("tok")).thenReturn("jti-bad");
        when(revocationService.isBlacklisted("jti-bad")).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        request.setRequestURI("/api/v1/members");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(401, response.getStatus());
        assertNull(chain.getRequest());
        assertTrue(response.getContentAsString().contains("AUTH_TOKEN_REVOKED"));
    }

    @Test
    void shouldReturn401_whenPermissionEpochStale() throws Exception {
        when(jwtUtil.validateJwt("tok")).thenReturn(true);
        when(jwtUtil.getTokenIdFromToken("tok")).thenReturn("jti-1");
        when(revocationService.isBlacklisted("jti-1")).thenReturn(false);
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.claims().add("uid", 9).add("perm_epoch", 1).build();
        when(jwtUtil.getAllClaims("tok")).thenReturn(claims);
        when(revocationService.isEpochStale(9L, 1L)).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        request.setRequestURI("/api/v1/members");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(401, response.getStatus());
        assertNull(chain.getRequest());
        assertTrue(response.getContentAsString().contains("AUTH_TOKEN_STALE"));
    }
}
