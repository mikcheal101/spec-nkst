package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.user.api.request.RefreshTokenRequest;
import com.mikkytrionze.auth.user.api.response.RefreshTokenResponse;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import com.mikkytrionze.auth.user.domain.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContextException;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {
    @Value("${jwt.refreshExpiration}")
    private Long refreshExpirationMs;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    @Override
    public RefreshToken createRefreshToken(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        RefreshToken refreshToken = refreshTokenRepository
                .findByUserUsername(username)
                .orElseGet(() -> RefreshToken.builder().user(user).build());
        refreshToken
                .setToken(jwtUtil.generateToken(user.getUsername(), refreshExpirationMs, "refresh"));
        refreshToken
                .setExpiryDate(Instant.now().plusMillis(refreshExpirationMs));
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Boolean isTokenExpired(RefreshToken refreshToken) {
        return refreshToken.getExpiryDate().isBefore(Instant.now());
    }

    @Override
    public RefreshTokenResponse getRefreshToken(RefreshTokenRequest refreshTokenRequest) {
        String requestToken = refreshTokenRequest.getRefreshToken();
        String refreshToken = refreshTokenRepository.findByToken(requestToken)
                .map(token -> {
                    if (isTokenExpired(token)) {
                        refreshTokenRepository.delete(token);
                        log.error("Token expired!");
                        throw new ApplicationContextException("Token expired!");
                    }
                    return jwtUtil.generateToken(token.getUser().getUsername());
                })
                .orElseThrow(() -> {
                    log.error("Invalid refresh token!");
                    return new ApplicationContextException("Token expired!");
                });
        return RefreshTokenResponse.builder()
                .refreshToken(refreshToken)
                .build();
    }
}
