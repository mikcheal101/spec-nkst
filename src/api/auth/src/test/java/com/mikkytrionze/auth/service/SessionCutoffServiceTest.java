package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.user.application.service.SessionCutoffService;
import com.mikkytrionze.auth.user.domain.model.RefreshToken;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionCutoffServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock AuditLogService auditLogService;
    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @InjectMocks SessionCutoffService service;

    @Test
    void cutoffUser_incrementsEpochRevokesRefreshAndPublishesRedis() {
        User user = User.builder().id(5L).username("u").permissionEpoch(1L).build();
        RefreshToken t1 = RefreshToken.builder().id(1L).token("a").user(user).build();
        RefreshToken t2 = RefreshToken.builder().id(2L).token("b").user(User.builder().id(6L).build()).build();
        when(refreshTokenRepository.findAll()).thenReturn(List.of(t1, t2));
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        service.cutoffUser(user, "ROLE_CHANGED", 9L, "admin");

        assertEquals(2L, user.getPermissionEpoch());
        assertNotNull(user.getLastSecurityChangeAt());
        assertNotNull(t1.getRevokedAt());
        assertEquals("ROLE_CHANGED", t1.getRevocationReason());
        assertNull(t2.getRevokedAt());
        verify(userRepository).save(user);
        verify(refreshTokenRepository).save(t1);
        verify(refreshTokenRepository, never()).save(t2);
        verify(valueOps).set("user:perm_epoch:5", "2");
        verify(auditLogService).record(eq("AUTH_SESSION_CUTOFF"), eq("USER"), eq("5"), eq("SUCCESS"), eq("ROLE_CHANGED"), eq(9L), eq("admin"), any(), any(), any(), any());
    }

    @Test
    void cutoffUser_stillRevokesAndAuditsWhenRedisFails() {
        User user = User.builder().id(5L).username("u").permissionEpoch(0L).build();
        when(refreshTokenRepository.findAll()).thenReturn(List.of());
        when(redisTemplate.opsForValue()).thenThrow(new RuntimeException("redis down"));

        assertDoesNotThrow(() -> service.cutoffUser(user, "REASON", 1L, "actor"));
        assertEquals(1L, user.getPermissionEpoch());
        verify(userRepository).save(user);
        verify(auditLogService).record(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
    }
}
