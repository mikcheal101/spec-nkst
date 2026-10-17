package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.user.api.request.SignInRequest;
import com.mikkytrionze.auth.user.api.request.SignOutRequest;
import com.mikkytrionze.auth.user.api.request.SignupRequest;
import com.mikkytrionze.auth.user.api.response.SignInResponse;
import com.mikkytrionze.auth.user.application.exception.UserAlreadyExistsException;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import com.mikkytrionze.auth.user.domain.service.RefreshTokenService;
import com.mikkytrionze.auth.user.domain.service.TokenBlacklistService;
import com.mikkytrionze.auth.user.application.service.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(authenticationManager,
                jwtUtil,
                userRepository,
                refreshTokenRepository,
                passwordEncoder,
                tokenBlacklistService,
                refreshTokenService);
    }

    @Test
    void authenticateUser_withValidCredentials_returnsToken() {
        String username = "test-user";
        String password = "test-password";
        String expectedToken = "jwt-token";
        RefreshToken refreshToken = RefreshToken.builder()
                .user(User.builder().build())
                .id(99L)
                .expiryDate(Instant.now())
                .token("refresh-token")
                .build();

        SignInRequest request = SignInRequest.builder()
                .username(username)
                .password(password)
                .build();

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                username, password, Collections.emptyList());

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtUtil.generateToken(eq(username), any(Map.class))).thenReturn(expectedToken);
        when(refreshTokenService.createRefreshToken(username)).thenReturn(refreshToken);

        SignInResponse response = authService.authenticateUser(request);

        assertEquals(expectedToken, response.getToken());
        assertEquals(refreshToken.getToken(), response.getRefreshToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtUtil).generateToken(eq(username), any(Map.class));
    }

    @Test
    void authenticateUser_withInvalidCredentials_throwsException() {
        SignInRequest request = SignInRequest.builder()
                .username("test-user")
                .password("wrong-password")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.authenticateUser(request));
    }

    @Test
    void registerUser_withNewUsername_returnsTrue() {
        String username = "new-user";
        String password = "Password123!";
        String encodedPassword = "encoded-password";

        SignupRequest request = SignupRequest.builder()
                .username(username)
                .password(password)
                .confirmPassword(password)
                .build();

        when(userRepository.existsByUsername(username)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Boolean result = authService.registerUser(request);

        assertTrue(result);
        verify(userRepository).existsByUsername(username);
        verify(passwordEncoder).encode(password);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_withDuplicateUsername_throwsException() {
        String username = "existing-user";

        SignupRequest request = SignupRequest.builder()
                .username(username)
                .password("Password123!")
                .confirmPassword("Password123!")
                .build();

        when(userRepository.existsByUsername(username)).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.registerUser(request));
        verify(userRepository).existsByUsername(username);
        verify(userRepository, never()).save(any());
    }

    @Test
    void logOutUser_withValidRefreshToken_deletesAndReturnsTrue() {
        String refreshTokenValue = "valid-refresh-jwt";
        SignOutRequest request = SignOutRequest.builder()
                .refreshToken(refreshTokenValue)
                .build();
        RefreshToken storedToken = RefreshToken.builder()
                .token(refreshTokenValue)
                .build();

        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(storedToken));

        Boolean result = authService.logOutUser(request);

        assertTrue(result);
        verify(refreshTokenRepository).findByToken(refreshTokenValue);
        verify(refreshTokenRepository).delete(storedToken);
        verify(tokenBlacklistService, never()).blacklist(any(), anyLong());
    }

    @Test
    void logOutUser_withNonExistentToken_returnsFalse() {
        String token = "nonexistent-token";
        SignOutRequest request = SignOutRequest.builder().refreshToken(token).build();

        when(refreshTokenRepository.findByToken(token)).thenReturn(Optional.empty());

        Boolean result = authService.logOutUser(request);

        assertFalse(result);
        verify(refreshTokenRepository).findByToken(token);
        verify(refreshTokenRepository, never()).delete(any());
        verify(tokenBlacklistService, never()).blacklist(any(), anyLong());
    }

    @Test
    void logOutUser_withAccessToken_blacklistsJtiAndDeletesRefresh() {
        String refreshTokenValue = "valid-refresh-jwt";
        String accessToken = "access-jwt-token";
        String jti = "uuid-jti";
        SignOutRequest request = SignOutRequest.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .build();
        RefreshToken storedToken = RefreshToken.builder()
                .token(refreshTokenValue).build();

        when(jwtUtil.getTokenIdFromToken(accessToken)).thenReturn(jti);
        when(jwtUtil.getExpirationFromToken(accessToken)).thenReturn(1800000L);
        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(storedToken));

        Boolean result = authService.logOutUser(request);

        assertTrue(result);
        verify(jwtUtil).getTokenIdFromToken(accessToken);
        verify(jwtUtil).getExpirationFromToken(accessToken);
        verify(tokenBlacklistService).blacklist(jti, 1800000L);
        verify(refreshTokenRepository).findByToken(refreshTokenValue);
        verify(refreshTokenRepository).delete(storedToken);
    }

    @Test
    void logOutUser_withExpiredAccessToken_skipsBlacklistButDeletesRefresh() {
        String refreshTokenValue = "valid-refresh-jwt";
        String accessToken = "expired-access-jwt";
        SignOutRequest request = SignOutRequest.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .build();
        RefreshToken storedToken = RefreshToken.builder().token(refreshTokenValue).build();

        when(jwtUtil.getTokenIdFromToken(accessToken)).thenReturn("some-jti");
        when(jwtUtil.getExpirationFromToken(accessToken)).thenReturn(-1000L);
        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(storedToken));

        Boolean result = authService.logOutUser(request);

        assertTrue(result);
        verify(jwtUtil).getTokenIdFromToken(accessToken);
        verify(jwtUtil).getExpirationFromToken(accessToken);
        verify(tokenBlacklistService, never()).blacklist(any(), anyLong());
        verify(refreshTokenRepository).delete(storedToken);
    }

    @Test
    void logOutUser_withBlankAccessToken_skipsBlacklistAndDeletesRefresh() {
        String refreshTokenValue = "valid-refresh-jwt";
        SignOutRequest request = SignOutRequest.builder()
                .accessToken("   ")
                .refreshToken(refreshTokenValue)
                .build();
        RefreshToken storedToken = RefreshToken.builder().token(refreshTokenValue).build();

        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(storedToken));

        Boolean result = authService.logOutUser(request);

        assertTrue(result);
        verify(tokenBlacklistService, never()).blacklist(any(), anyLong());
        verify(refreshTokenRepository).delete(storedToken);
    }

    @Test
    void logOutUser_withBlacklistException_continuesLogout() {
        String refreshTokenValue = "valid-refresh-jwt";
        String accessToken = "access-jwt-token";
        SignOutRequest request = SignOutRequest.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .build();
        RefreshToken storedToken = RefreshToken.builder().token(refreshTokenValue).build();

        when(jwtUtil.getTokenIdFromToken(accessToken)).thenThrow(new RuntimeException("JWT error"));
        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(storedToken));

        Boolean result = authService.logOutUser(request);

        assertTrue(result);
        verify(refreshTokenRepository).delete(storedToken);
    }
}
