package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class SessionCutoffService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogService auditLogService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @Transactional
    public void cutoffUser(User user, String reason, Long actorId, String actorUsername) {
        user.setPermissionEpoch(user.getPermissionEpoch() + 1);
        user.setLastSecurityChangeAt(Instant.now());
        userRepository.save(user);
        try { redisTemplate.opsForValue().set("user:perm_epoch:" + user.getId(), String.valueOf(user.getPermissionEpoch())); } catch (Exception ignored) {}
        refreshTokenRepository.findAll().stream()
                .filter(t -> t.getUser() != null && t.getUser().getId().equals(user.getId()))
                .filter(t -> t.getRevokedAt() == null)
                .forEach(t -> { t.setRevokedAt(Instant.now()); t.setRevocationReason(reason); refreshTokenRepository.save(t); });
        auditLogService.record("AUTH_SESSION_CUTOFF", "USER", String.valueOf(user.getId()), "SUCCESS", reason, actorId, actorUsername, null, null, null, null);
    }
}
