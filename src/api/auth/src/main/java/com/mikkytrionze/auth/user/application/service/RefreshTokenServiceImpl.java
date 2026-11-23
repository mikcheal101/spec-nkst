package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.RateLimitService;
import com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig;
import com.mikkytrionze.auth.user.api.request.RefreshTokenRequest;
import com.mikkytrionze.auth.user.api.response.RefreshTokenResponse;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.domain.service.RefreshTokenService;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {
    @Value("${jwt.refreshExpiration:604800000}")
    private Long refreshExpirationMs;
    @Value("${auth.access-token.ttl-minutes:15}")
    private long accessTtlMinutes;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final RateLimitService rateLimitService;
    private final RateLimitConfig rateLimitConfig;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "Invalid credentials"));
        String familyId = UUID.randomUUID().toString();
        RefreshToken token = issue(user, familyId, null);
        return refreshTokenRepository.save(token);
    }

    @Override
    public Boolean isTokenExpired(RefreshToken refreshToken) {
        return refreshToken.getExpiryDate().isBefore(Instant.now()) || refreshToken.getRevokedAt() != null;
    }

    @Override
    @Transactional
    public RefreshTokenResponse getRefreshToken(RefreshTokenRequest refreshTokenRequest) {
        HttpServletRequest req = currentRequest();
        String ip = req != null ? req.getRemoteAddr() : "unknown";
        String ua = req != null ? req.getHeader("User-Agent") : null;
        rateLimitService.check("refresh:" + ip, rateLimitConfig.getRefreshMaxRequests(), rateLimitConfig.getRefreshWindowMinutes());
        String requestToken = refreshTokenRequest.getRefreshToken();
        RefreshToken token = refreshTokenRepository.findByToken(requestToken)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_REFRESH_TOKEN", "Refresh token is invalid"));

        if (token.getRevokedAt() != null || token.getRotatedAt() != null) {
            // reuse detection
            revokeFamily(token.getFamilyId(), "REUSE_DETECTED");
            auditLogService.record("AUTH_REFRESH_REUSE", "REFRESH_TOKEN_FAMILY", token.getFamilyId(), "DENIED", "REFRESH_REUSE_DETECTED", token.getUser().getId(), token.getUser().getUsername(), null, null, ip, ua);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REFRESH_REUSE_DETECTED", "Refresh token reuse detected");
        }
        if (isTokenExpired(token)) {
            token.setRevokedAt(Instant.now());
            token.setRevocationReason("EXPIRED");
            refreshTokenRepository.save(token);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REFRESH_EXPIRED", "Refresh token expired");
        }
        User user = token.getUser();
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_ACCOUNT_NOT_ELIGIBLE", "Account is not eligible for authentication");
        }
        String oldJti = token.getTokenJti();
        token.setRotatedAt(Instant.now());
        token.setRevokedAt(Instant.now());
        token.setRevocationReason("ROTATED");
        RefreshToken next = issue(user, token.getFamilyId(), oldJti);
        token.setReplacedByJti(next.getTokenJti());
        refreshTokenRepository.save(token);
        refreshTokenRepository.save(next);

        Set<String> authorities = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getKey() != null ? p.getKey() : p.getName())
                .collect(Collectors.toSet());
        long ttlMs = accessTtlMinutes * 60 * 1000;
        String access = jwtUtil.generateToken(user.getUsername(), ttlMs, "access", Map.of("authorities", authorities, "perm_epoch", user.getPermissionEpoch(), "uid", user.getId()));
        auditLogService.record("AUTH_REFRESH", "USER", String.valueOf(user.getId()), "SUCCESS", null, user.getId(), user.getUsername(), null, null, ip, ua);
        return RefreshTokenResponse.builder()
                .accessToken(access)
                .refreshToken(next.getToken())
                .tokenType("Bearer")
                .expiresIn(ttlMs / 1000)
                .permissionsVersion(user.getPermissionEpoch())
                .build();
    }

    private RefreshToken issue(User user, String familyId, String replacedByIgnored) {
        String jti = UUID.randomUUID().toString();
        long ttlMs = refreshExpirationMs;
        String raw = jwtUtil.generateToken(user.getUsername(), ttlMs, "refresh", Map.of("jti", jti, "family", familyId, "uid", user.getId()));
        RefreshToken token = RefreshToken.builder().user(user).build();
        token.setToken(raw);
        token.setTokenJti(jti);
        token.setFamilyId(familyId);
        token.setTokenHash(hash(raw));
        token.setIssuedAt(Instant.now());
        token.setExpiryDate(Instant.now().plusMillis(ttlMs));
        token.setRevocationReason(null);
        token.setRevokedAt(null);
        token.setRotatedAt(null);
        return token;
    }

    private void revokeFamily(String familyId, String reason) {
        if (familyId == null) return;
        refreshTokenRepository.findAll().stream().filter(t -> familyId.equals(t.getFamilyId())).forEach(t -> {
            if (t.getRevokedAt() == null) { t.setRevokedAt(Instant.now()); t.setRevocationReason(reason); refreshTokenRepository.save(t); }
        });
    }

    private String hash(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) return sra.getRequest();
        return null;
    }
}
