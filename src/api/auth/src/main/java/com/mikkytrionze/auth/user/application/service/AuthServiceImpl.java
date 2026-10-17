package com.mikkytrionze.auth.user.application.service;

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
import com.mikkytrionze.auth.user.domain.service.AuthService;
import com.mikkytrionze.auth.user.domain.service.RefreshTokenService;
import com.mikkytrionze.auth.user.domain.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklistService tokenBlacklistService;
    private final RefreshTokenService refreshTokenService;

    @Override
    public SignInResponse authenticateUser(SignInRequest signInRequest) {
        UserDetails userDetails = (UserDetails) authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        signInRequest.getUsername(),
                        signInRequest.getPassword()
                )
        ).getPrincipal();
        if (Objects.isNull(userDetails.getUsername())) {
            return null;
        }

        Set<String> authorities = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        // set if it is a mobile authentication or not
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities", authorities);
        claims.put("is_mobile", Boolean.TRUE.equals(signInRequest.getIsMobileAuthentication()));

        return SignInResponse.builder()
                .token(jwtUtil.generateToken(userDetails.getUsername(), claims))
                .refreshToken(refreshTokenService.createRefreshToken(userDetails.getUsername()).getToken())
                .build();
    }

    @Override
    public Boolean registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            log.error("Username already taken: {}", signupRequest.getUsername());
            throw new UserAlreadyExistsException("Username already taken: " + signupRequest.getUsername());
        }

        User user = User.builder()
                .username(signupRequest.getUsername())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .build();
        userRepository.save(user);
        return true;
    }

    @Override
    public Boolean logOutUser(SignOutRequest signOutRequest) {
        if (signOutRequest.getAccessToken() != null && !signOutRequest.getAccessToken().isBlank()) {
            try {
                String jti = jwtUtil.getTokenIdFromToken(signOutRequest.getAccessToken());
                long expirationTimeMs = jwtUtil.getExpirationFromToken(signOutRequest.getAccessToken());
                long currentTimestamp = System.currentTimeMillis();
                long ttlMs = expirationTimeMs - currentTimestamp;

                if (ttlMs > 0) {
                    tokenBlacklistService.blacklist(jti, ttlMs);
                }
            } catch (Exception e) {
                log.warn("Failed to blacklist access token on logout: {}", e.getMessage());
            }
        }
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(signOutRequest.getRefreshToken());
        if (refreshToken.isPresent()) {
            refreshTokenRepository.delete(refreshToken.get());
            return true;
        }
        log.warn("No refresh token found for logout: {}", signOutRequest.getRefreshToken());
        return false;
    }
}
