package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.user.api.request.RefreshTokenRequest;
import com.mikkytrionze.auth.user.api.response.RefreshTokenResponse;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import com.mikkytrionze.auth.user.application.service.RefreshTokenServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContextException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private com.mikkytrionze.auth.common.application.service.RateLimitService rateLimitService;
    @Mock
    private com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig rateLimitConfig;
    @Mock
    private com.mikkytrionze.auth.common.application.service.AuditLogService auditLogService;

    private RefreshTokenServiceImpl refreshTokenService;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenServiceImpl(userRepository, refreshTokenRepository, jwtUtil, rateLimitService, rateLimitConfig, auditLogService);
        ReflectionTestUtils.setField(refreshTokenService, "refreshExpirationMs", 86400000L);
        ReflectionTestUtils.setField(refreshTokenService, "accessTtlMinutes", 15L);
        lenient().when(rateLimitConfig.getRefreshMaxRequests()).thenReturn(30);
        lenient().when(rateLimitConfig.getRefreshWindowMinutes()).thenReturn(15);
    }

    @Test
    void getRefreshToken_withValidNonExpiredToken_returnsNewJwt() {
        User user = User.builder().id(1L).username("test-user").accountStatus(AccountStatus.ACTIVE).permissionEpoch(0L).roles(Set.of()).build();
        RefreshToken storedToken = RefreshToken.builder().user(user).token("valid-refresh-jwt").expiryDate(Instant.now().plusMillis(100000)).build();
        storedToken.setFamilyId("fam1"); storedToken.setTokenJti("jti1");
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-jwt");

        when(refreshTokenRepository.findByToken("valid-refresh-jwt")).thenReturn(Optional.of(storedToken));
        when(jwtUtil.generateToken(eq("test-user"), anyLong(), eq("access"), any())).thenReturn("new-access-token");
        when(jwtUtil.generateToken(eq("test-user"), anyLong(), eq("refresh"), any())).thenReturn("new-refresh-token");

        RefreshTokenResponse result = refreshTokenService.getRefreshToken(request);

        assertEquals("new-access-token", result.getAccessToken());
        verify(refreshTokenRepository).findByToken("valid-refresh-jwt");
    }

    @Test
    void getRefreshToken_withExpiredToken_deletesAndThrows() {
        User user = User.builder().id(1L).username("test-user").build();
        RefreshToken expiredToken = RefreshToken.builder()
                .user(user)
                .token("expired-refresh-jwt")
                .expiryDate(Instant.now().minusMillis(1000))
                .build();
        RefreshTokenRequest request = new RefreshTokenRequest("expired-refresh-jwt");

        when(refreshTokenRepository.findByToken("expired-refresh-jwt")).thenReturn(Optional.of(expiredToken));

        com.mikkytrionze.auth.common.application.exception.ApiException exception = assertThrows(
                com.mikkytrionze.auth.common.application.exception.ApiException.class,
                () -> refreshTokenService.getRefreshToken(request)
        );
        assertNotNull(exception.getCode());
        verify(refreshTokenRepository).save(expiredToken);
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    void getRefreshToken_withNonExistentToken_throws() {
        RefreshTokenRequest request = new RefreshTokenRequest("nonexistent-refresh-jwt");

        when(refreshTokenRepository.findByToken("nonexistent-refresh-jwt")).thenReturn(Optional.empty());

        com.mikkytrionze.auth.common.application.exception.ApiException exception = assertThrows(
                com.mikkytrionze.auth.common.application.exception.ApiException.class,
                () -> refreshTokenService.getRefreshToken(request)
        );
        assertNotNull(exception.getCode());
        verify(refreshTokenRepository).findByToken("nonexistent-refresh-jwt");
        verify(refreshTokenRepository, never()).delete(any());
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    void createRefreshToken_withValidUserId_returnsSavedToken() {
        String username = "test-user";
        User user = User.builder().id(1L).username(username).build();
        Instant now = Instant.now();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .expiryDate(now.plusMillis(86400000))
                .token("generated-refresh-jwt")
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(eq(username), eq(86400000L), eq("refresh"), any())).thenReturn("generated-refresh-jwt");
        lenient().when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(refreshToken);

        RefreshToken result = refreshTokenService.createRefreshToken(username);

        assertNotNull(result);
        assertEquals("generated-refresh-jwt", result.getToken());
        assertEquals(user, result.getUser());
        verify(userRepository).findByUsername(username);
        verify(jwtUtil).generateToken(eq(username), eq(86400000L), eq("refresh"), any());
        assertNotNull(result.getToken());
    }

    @Test
    void createRefreshToken_withInvalidUserId_throws() {
        String username = "test-username";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        com.mikkytrionze.auth.common.application.exception.ApiException exception = assertThrows(
                com.mikkytrionze.auth.common.application.exception.ApiException.class,
                () -> refreshTokenService.createRefreshToken(username)
        );
        assertEquals("AUTH_INVALID_CREDENTIALS", exception.getCode());
        assertEquals(401, exception.getStatus().value());
        verify(userRepository).findByUsername(username);
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void isTokenExpired_withExpiredToken_returnsTrue() {
        RefreshToken expiredToken = RefreshToken.builder()
                .expiryDate(Instant.now().minusMillis(1000))
                .build();

        assertTrue(refreshTokenService.isTokenExpired(expiredToken));
    }

    @Test
    void isTokenExpired_withNonExpiredToken_returnsFalse() {
        RefreshToken validToken = RefreshToken.builder()
                .expiryDate(Instant.now().plusMillis(100000))
                .build();

        assertFalse(refreshTokenService.isTokenExpired(validToken));
    }

    @Test
    void getRefreshToken_reuseDetected_revokesFamilyAndThrows401() {
        User user = User.builder().id(1L).username("test-user").accountStatus(AccountStatus.ACTIVE).permissionEpoch(0L).roles(Set.of()).build();
        RefreshToken revoked = RefreshToken.builder().user(user).token("old").expiryDate(Instant.now().plusMillis(100000)).build();
        revoked.setFamilyId("fam1"); revoked.setTokenJti("jti1"); revoked.setRotatedAt(Instant.now()); revoked.setRevokedAt(Instant.now());
        RefreshToken sibling = RefreshToken.builder().user(user).token("sib").expiryDate(Instant.now().plusMillis(100000)).build();
        sibling.setFamilyId("fam1"); sibling.setTokenJti("jti2");
        when(refreshTokenRepository.findByToken("old")).thenReturn(Optional.of(revoked));
        when(refreshTokenRepository.findAll()).thenReturn(java.util.List.of(revoked, sibling));

        com.mikkytrionze.auth.common.application.exception.ApiException ex = assertThrows(com.mikkytrionze.auth.common.application.exception.ApiException.class,
                () -> refreshTokenService.getRefreshToken(new RefreshTokenRequest("old")));
        assertEquals(401, ex.getStatus().value());
        assertEquals("AUTH_REFRESH_REUSE_DETECTED", ex.getCode());
        verify(refreshTokenRepository, atLeastOnce()).save(sibling);
        verify(auditLogService).record(eq("AUTH_REFRESH_REUSE"), eq("REFRESH_TOKEN_FAMILY"), eq("fam1"), eq("DENIED"), eq("REFRESH_REUSE_DETECTED"), any(), any(), any(), any(), any(), any());
    }

    @Test
    void getRefreshToken_rotatesTokenAndReturnsNewAccessRefreshPair() {
        User user = User.builder().id(1L).username("test-user").accountStatus(AccountStatus.ACTIVE).permissionEpoch(2L).roles(Set.of()).build();
        RefreshToken storedToken = RefreshToken.builder().user(user).token("valid-refresh-jwt").expiryDate(Instant.now().plusMillis(100000)).build();
        storedToken.setFamilyId("fam1"); storedToken.setTokenJti("jti1");
        when(refreshTokenRepository.findByToken("valid-refresh-jwt")).thenReturn(Optional.of(storedToken));
        when(jwtUtil.generateToken(eq("test-user"), eq(900000L), eq("access"), any())).thenReturn("new-access-token");
        when(jwtUtil.generateToken(eq("test-user"), eq(86400000L), eq("refresh"), any())).thenReturn("new-refresh-token");

        RefreshTokenResponse result = refreshTokenService.getRefreshToken(new RefreshTokenRequest("valid-refresh-jwt"));

        assertEquals("new-access-token", result.getAccessToken());
        assertEquals("new-refresh-token", result.getRefreshToken());
        assertEquals(2L, result.getPermissionsVersion());
        assertNotNull(storedToken.getRotatedAt());
        assertNotNull(storedToken.getRevokedAt());
        assertEquals("ROTATED", storedToken.getRevocationReason());
        assertNotNull(storedToken.getReplacedByJti());
        verify(refreshTokenRepository, atLeast(2)).save(any(RefreshToken.class));
    }

    @Test
    void getRefreshToken_whenAccountNotActive_throwsNotEligible() {
        User user = User.builder().id(1L).username("test-user").accountStatus(AccountStatus.DISABLED).permissionEpoch(0L).roles(Set.of()).build();
        RefreshToken storedToken = RefreshToken.builder().user(user).token("valid-refresh-jwt").expiryDate(Instant.now().plusMillis(100000)).build();
        storedToken.setFamilyId("fam1"); storedToken.setTokenJti("jti1");
        when(refreshTokenRepository.findByToken("valid-refresh-jwt")).thenReturn(Optional.of(storedToken));

        com.mikkytrionze.auth.common.application.exception.ApiException ex = assertThrows(com.mikkytrionze.auth.common.application.exception.ApiException.class,
                () -> refreshTokenService.getRefreshToken(new RefreshTokenRequest("valid-refresh-jwt")));
        assertEquals(401, ex.getStatus().value());
        assertEquals("AUTH_ACCOUNT_NOT_ELIGIBLE", ex.getCode());
    }
}
