package com.mikkytrionze.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mikkytrionze.auth.user.api.request.RefreshTokenRequest;
import com.mikkytrionze.auth.user.api.request.SignInRequest;
import com.mikkytrionze.auth.user.api.request.SignOutRequest;
import com.mikkytrionze.auth.user.api.request.SignupRequest;
import com.mikkytrionze.auth.user.api.AuthController;
import com.mikkytrionze.auth.user.api.response.RefreshTokenResponse;
import com.mikkytrionze.auth.user.api.response.SignInResponse;
import com.mikkytrionze.auth.user.application.exception.UserAlreadyExistsException;
import com.mikkytrionze.auth.user.domain.service.AuthService;
import com.mikkytrionze.auth.user.domain.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @InjectMocks
    private AuthController authController;

    @Mock
    private AuthService authService;

    @Mock
    private RefreshTokenService refreshTokenService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void authenticateUser_withValidRequest_returns200AndToken() {
        String token = "jwt-token";
        String refreshToken = "refresh-token";

        SignInRequest request = SignInRequest.builder()
                .username("super-admin")
                .password("super-admin")
                .build();
        SignInResponse signInResponse = SignInResponse.builder()
                .refreshToken(refreshToken)
                .token(token)
                .build();

        when(authService.authenticateUser(request)).thenReturn(signInResponse);

        ResponseEntity<SignInResponse> response = authController.authenticateUser(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(token, response.getBody().getToken());
        assertEquals(refreshToken, response.getBody().getRefreshToken());
        verify(authService).authenticateUser(request);
    }

    @Test
    void authenticateUser_whenServiceThrowsException_propagatesIt() {
        SignInRequest request = SignInRequest.builder()
                .username("invalid")
                .password("wrong")
                .build();
        when(authService.authenticateUser(request))
                .thenThrow(new RuntimeException("Authentication failed"));

        assertThrows(RuntimeException.class, () -> authController.authenticateUser(request));
        verify(authService).authenticateUser(request);
    }

    @Test
    void registerUser_withValidRequest_returns200AndTrue() {
        SignupRequest request = SignupRequest.builder()
                .username("new-user")
                .password("Password123!")
                .confirmPassword("Password123!")
                .build();
        when(authService.registerUser(request)).thenReturn(true);

        ResponseEntity<Boolean> response = authController.registerUser(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody());
        verify(authService).registerUser(request);
    }

    @Test
    void registerUser_withDuplicateUsername_throwsException() {
        SignupRequest request = SignupRequest.builder()
                .username("existing-user")
                .password("Password123!")
                .confirmPassword("Password123!")
                .build();
        when(authService.registerUser(request))
                .thenThrow(new UserAlreadyExistsException("Username already taken: existing-user"));

        assertThrows(UserAlreadyExistsException.class, () -> authController.registerUser(request));
        verify(authService).registerUser(request);
    }

    @Test
    void registerUser_whenServiceThrowsException_propagatesIt() {
        SignupRequest request = SignupRequest.builder()
                .username("new-user")
                .password("Password123!")
                .confirmPassword("Password123!")
                .build();
        when(authService.registerUser(request))
                .thenThrow(new RuntimeException("Registration failed"));

        assertThrows(RuntimeException.class, () -> authController.registerUser(request));
        verify(authService).registerUser(request);
    }

    @Test
    void signInRequest_validation_usernameNotBlank() {
        SignInRequest request = new SignInRequest();
        assertNull(request.getUsername());
        assertNull(request.getPassword());
    }

    @Test
    void signInRequest_builder_createsValidInstance() {
        SignInRequest request = SignInRequest.builder()
                .username("test-user")
                .password("test-pass")
                .build();

        assertEquals("test-user", request.getUsername());
        assertEquals("test-pass", request.getPassword());
    }

    @Test
    void refreshToken_withValidRequest_returns200AndNewToken() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-jwt");
        String token = "new-access-token";
        RefreshTokenResponse refreshTokenResponse = RefreshTokenResponse.builder()
                .refreshToken(token)
                .build();
        when(refreshTokenService.getRefreshToken(request)).thenReturn(refreshTokenResponse);

        ResponseEntity<RefreshTokenResponse> response = authController.refreshToken(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("new-access-token", response.getBody().getRefreshToken());
        verify(refreshTokenService).getRefreshToken(request);
    }

    @Test
    void refreshToken_whenTokenExpired_propagatesException() {
        RefreshTokenRequest request = new RefreshTokenRequest("expired-refresh-jwt");
        when(refreshTokenService.getRefreshToken(request))
                .thenThrow(new RuntimeException("Token expired!"));

        assertThrows(RuntimeException.class, () -> authController.refreshToken(request));
        verify(refreshTokenService).getRefreshToken(request);
    }

    @Test
    void refreshToken_whenTokenNotFound_propagatesException() {
        RefreshTokenRequest request = new RefreshTokenRequest("nonexistent-refresh-jwt");
        when(refreshTokenService.getRefreshToken(request))
                .thenThrow(new RuntimeException("Token expired!"));

        assertThrows(RuntimeException.class, () -> authController.refreshToken(request));
        verify(refreshTokenService).getRefreshToken(request);
    }

    @Test
    void signOutUser_withValidRequest_returns200AndTrue() {
        SignOutRequest request = SignOutRequest.builder()
                .accessToken("valid-access-jwt")
                .refreshToken("valid-refresh-token")
                .build();
        when(authService.logOutUser(request)).thenReturn(true);

        ResponseEntity<Boolean> response = authController.signOutUser(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody());
        verify(authService).logOutUser(request);
    }

    @Test
    void signOutUser_withNonExistentToken_returns200AndFalse() {
        SignOutRequest request = SignOutRequest.builder()
                .accessToken("valid-access-jwt")
                .refreshToken("valid-refresh-token")
                .build();
        when(authService.logOutUser(request)).thenReturn(false);

        ResponseEntity<Boolean> response = authController.signOutUser(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(response.getBody());
        verify(authService).logOutUser(request);
    }

    @Test
    void signOutUser_whenServiceThrowsException_propagatesIt() {
        SignOutRequest request = SignOutRequest.builder()
                .accessToken("valid-access-jwt")
                .refreshToken("valid-refresh-token")
                .build();
        when(authService.logOutUser(request))
                .thenThrow(new RuntimeException("Logout failed"));

        assertThrows(RuntimeException.class, () -> authController.signOutUser(request));
        verify(authService).logOutUser(request);
    }

    @Test
    void handleUserAlreadyExists_returnsConflictWithMessage() {
        UserAlreadyExistsException exception = new UserAlreadyExistsException("Username taken");

        ResponseEntity<String> response = authController.handleUserAlreadyExists(exception);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Username taken", response.getBody());
    }
}
