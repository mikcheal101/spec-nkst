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

    private RefreshTokenServiceImpl refreshTokenService;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenServiceImpl(userRepository, refreshTokenRepository, jwtUtil);
        ReflectionTestUtils.setField(refreshTokenService, "refreshExpirationMs", 86400000L);
    }

    @Test
    void getRefreshToken_withValidNonExpiredToken_returnsNewJwt() {
        User user = User.builder().id(1L).username("test-user").build();
        RefreshToken storedToken = RefreshToken.builder()
                .user(user)
                .token("valid-refresh-jwt")
                .expiryDate(Instant.now().plusMillis(100000))
                .build();
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-jwt");

        when(refreshTokenRepository.findByToken("valid-refresh-jwt")).thenReturn(Optional.of(storedToken));
        when(jwtUtil.generateToken("test-user")).thenReturn("new-access-token");

        RefreshTokenResponse result = refreshTokenService.getRefreshToken(request);

        assertEquals("new-access-token", result.getRefreshToken());
        verify(refreshTokenRepository).findByToken("valid-refresh-jwt");
        verify(jwtUtil).generateToken("test-user");
        verify(refreshTokenRepository, never()).delete(any());
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

        ApplicationContextException exception = assertThrows(
                ApplicationContextException.class,
                () -> refreshTokenService.getRefreshToken(request)
        );
        assertEquals("Token expired!", exception.getMessage());
        verify(refreshTokenRepository).delete(expiredToken);
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    void getRefreshToken_withNonExistentToken_throws() {
        RefreshTokenRequest request = new RefreshTokenRequest("nonexistent-refresh-jwt");

        when(refreshTokenRepository.findByToken("nonexistent-refresh-jwt")).thenReturn(Optional.empty());

        ApplicationContextException exception = assertThrows(
                ApplicationContextException.class,
                () -> refreshTokenService.getRefreshToken(request)
        );
        assertEquals("Token expired!", exception.getMessage());
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
        when(jwtUtil.generateToken(username, 86400000L, "refresh")).thenReturn("generated-refresh-jwt");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(refreshToken);

        RefreshToken result = refreshTokenService.createRefreshToken(username);

        assertNotNull(result);
        assertEquals("generated-refresh-jwt", result.getToken());
        assertEquals(user, result.getUser());
        verify(userRepository).findByUsername(username);
        verify(jwtUtil).generateToken(username, 86400000L, "refresh");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void createRefreshToken_withInvalidUserId_throws() {
        String username = "test-username";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> refreshTokenService.createRefreshToken(username)
        );
        assertEquals("User not found with username: " + username, exception.getMessage());
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
}
