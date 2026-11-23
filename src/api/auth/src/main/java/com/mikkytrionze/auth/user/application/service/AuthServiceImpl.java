package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.RateLimitService;
import com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig;
import com.mikkytrionze.auth.user.api.request.SignInRequest;
import com.mikkytrionze.auth.user.api.request.SignOutRequest;
import com.mikkytrionze.auth.user.api.request.SignupRequest;
import com.mikkytrionze.auth.user.api.response.SignInResponse;
import com.mikkytrionze.auth.user.application.exception.UserAlreadyExistsException;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.domain.service.AuthService;
import com.mikkytrionze.auth.user.domain.service.RefreshTokenService;
import com.mikkytrionze.auth.user.domain.service.TokenBlacklistService;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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
    private final RateLimitService rateLimitService;
    private final RateLimitConfig rateLimitConfig;
    private final AuditLogService auditLogService;

    @Value("${auth.access-token.ttl-minutes:15}")
    private long accessTtlMinutes;

    @Override
    public SignInResponse authenticateUser(SignInRequest signInRequest) {
        HttpServletRequest req = currentRequest();
        String ip = req != null ? req.getRemoteAddr() : "unknown";
        String ua = req != null ? req.getHeader("User-Agent") : null;
        rateLimitService.check("signin:" + ip + ":" + signInRequest.getUsername(), rateLimitConfig.getSigninMaxAttempts(), rateLimitConfig.getSigninWindowMinutes());
        try {
            UserDetails userDetails = (UserDetails) authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(signInRequest.getUsername(), signInRequest.getPassword())
            ).getPrincipal();
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "Invalid credentials"));
            if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                auditLogService.record("AUTH_SIGN_IN", "USER", String.valueOf(user.getId()), "DENIED", "ACCOUNT_NOT_ELIGIBLE", user.getId(), user.getUsername(), null, null, ip, ua);
                throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_ACCOUNT_NOT_ELIGIBLE", "Account is not eligible for authentication");
            }
            Set<String> authorities = userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
            Map<String, Object> claims = new HashMap<>();
            claims.put("authorities", authorities);
            claims.put("is_mobile", Boolean.TRUE.equals(signInRequest.getIsMobileAuthentication()));
            claims.put("perm_epoch", user.getPermissionEpoch());
            claims.put("uid", user.getId());
            long ttlMs = accessTtlMinutes * 60 * 1000;
            String access = jwtUtil.generateToken(userDetails.getUsername(), ttlMs, "access", claims);
            String refresh = refreshTokenService.createRefreshToken(userDetails.getUsername()).getToken();
            auditLogService.record("AUTH_SIGN_IN", "USER", String.valueOf(user.getId()), "SUCCESS", null, user.getId(), user.getUsername(), null, null, ip, ua);
            return SignInResponse.builder()
                    .accessToken(access)
                    .refreshToken(refresh)
                    .tokenType("Bearer")
                    .expiresIn(ttlMs / 1000)
                    .permissionsVersion(user.getPermissionEpoch())
                    .build();
        } catch (ApiException e) {
            throw e;
        } catch (AuthenticationException e) {
            auditLogService.record("AUTH_SIGN_IN", "USER", null, "DENIED", "AUTH_INVALID_CREDENTIALS", null, signInRequest.getUsername(), null, null, ip, ua);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "Invalid credentials");
        }
    }

    @Override
    public Boolean registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken: " + signupRequest.getUsername());
        }
        User user = User.builder()
                .username(signupRequest.getUsername())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .accountStatus(AccountStatus.ACTIVE)
                .permissionEpoch(0L)
                .build();
        userRepository.save(user);
        return true;
    }

    @Override
    public Boolean logOutUser(SignOutRequest signOutRequest) {
        HttpServletRequest req = currentRequest();
        String ip = req != null ? req.getRemoteAddr() : "unknown";
        String ua = req != null ? req.getHeader("User-Agent") : null;
        if (signOutRequest.getAccessToken() != null && !signOutRequest.getAccessToken().isBlank()) {
            try {
                String jti = jwtUtil.getTokenIdFromToken(signOutRequest.getAccessToken());
                long expirationTimeMs = jwtUtil.getExpirationFromToken(signOutRequest.getAccessToken());
                long ttlMs = expirationTimeMs - System.currentTimeMillis();
                if (ttlMs > 0) tokenBlacklistService.blacklist(jti, ttlMs);
            } catch (Exception e) {
                log.warn("Failed to blacklist access token on logout: {}", e.getMessage());
            }
        }
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(signOutRequest.getRefreshToken());
        if (refreshToken.isPresent()) {
            RefreshToken token = refreshToken.get();
            token.setRevokedAt(java.time.Instant.now());
            token.setRevocationReason("LOGOUT");
            refreshTokenRepository.save(token);
            auditLogService.record("AUTH_SIGN_OUT", "USER", String.valueOf(token.getUser().getId()), "SUCCESS", null, token.getUser().getId(), token.getUser().getUsername(), null, null, ip, ua);
            return true;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_INVALID_REFRESH_TOKEN", "Invalid refresh token");
    }

    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) return sra.getRequest();
        return null;
    }
}
