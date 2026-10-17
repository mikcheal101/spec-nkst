package com.mikkytrionze.auth.user.api;

import com.mikkytrionze.auth.user.api.request.RefreshTokenRequest;
import com.mikkytrionze.auth.user.api.request.SignInRequest;
import com.mikkytrionze.auth.user.api.request.SignOutRequest;
import com.mikkytrionze.auth.user.api.request.SignupRequest;
import com.mikkytrionze.auth.user.api.response.RefreshTokenResponse;
import com.mikkytrionze.auth.user.api.response.SignInResponse;
import com.mikkytrionze.auth.user.application.exception.UserAlreadyExistsException;
import com.mikkytrionze.auth.user.domain.service.AuthService;
import com.mikkytrionze.auth.user.domain.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.core.environment.Environment;
import org.springframework.core.annotation.Value;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    @Value("${nkst.features.memberSelfService:true}")
    private boolean memberSelfServiceEnabled;

    @PostMapping("/sign-in")
    public ResponseEntity<SignInResponse> authenticateUser(@RequestBody @Valid SignInRequest signInRequest) {
        SignInResponse response = authService.authenticateUser(signInRequest);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping("/sign-up")
    public ResponseEntity<Boolean> registerUser(@RequestBody @Valid SignupRequest signupRequest) {
        if (!memberSelfServiceEnabled) {
            return ResponseEntity.status(403).body(false);
        }
        Boolean response = authService.registerUser(signupRequest);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest refreshTokenRequest) {
        RefreshTokenResponse token = refreshTokenService.getRefreshToken(refreshTokenRequest);
        return ResponseEntity.ok().body(token);
    }

    @PostMapping("/sign-out")
    public ResponseEntity<Boolean> signOutUser(@RequestBody @Valid SignOutRequest signoutRequest) {
        Boolean loggedOutSuccessfully = authService.logOutUser(signoutRequest);
        return ResponseEntity.ok().body(loggedOutSuccessfully);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<String> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }
}