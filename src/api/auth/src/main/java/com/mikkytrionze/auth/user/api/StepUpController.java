package com.mikkytrionze.auth.user.api;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.RateLimitService;
import com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class StepUpController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final RateLimitService rateLimitService;
    private final RateLimitConfig rateLimitConfig;
    private final AuditLogService auditLogService;

    @PostMapping("/step-up")
    public ResponseEntity<Map<String, Object>> stepUp(@RequestBody Map<String, String> body, Authentication auth, HttpServletRequest req) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required");
        }
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required"));
        String ip = req.getRemoteAddr();
        rateLimitService.check("stepup:" + user.getId() + ":" + ip, rateLimitConfig.getStepupGovernanceMaxRequests(), rateLimitConfig.getStepupGovernanceWindowMinutes());
        String password = body.get("password");
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            auditLogService.record("AUTH_STEP_UP", "USER", String.valueOf(user.getId()), "DENIED", "INVALID_PASSWORD", user.getId(), username, null, null, ip, req.getHeader("User-Agent"));
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_STEP_UP_INVALID", "Invalid credentials");
        }
        String token = UUID.randomUUID().toString();
        long ttl = 300;
        try { redisTemplate.opsForValue().set("stepup:" + token, String.valueOf(user.getId()), Duration.ofSeconds(ttl)); } catch (Exception ignored) {}
        auditLogService.record("AUTH_STEP_UP", "USER", String.valueOf(user.getId()), "SUCCESS", null, user.getId(), username, null, null, ip, req.getHeader("User-Agent"));
        return ResponseEntity.ok(Map.of("stepUpToken", token, "expiresIn", ttl));
    }
}
