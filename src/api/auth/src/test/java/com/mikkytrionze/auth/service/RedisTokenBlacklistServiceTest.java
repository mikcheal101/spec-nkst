package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.user.application.service.RedisTokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RedisTokenBlacklistServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RedisTokenBlacklistService service;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        @SuppressWarnings("unchecked")
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(redisTemplate);

        service = new RedisTokenBlacklistService(provider);
    }

    @Test
    void blacklist_withAvailableRedis_setsKey() {
        service.blacklist("test-jti", 60000L);

        verify(valueOperations).set("blacklist:test-jti", "1", 60000L, TimeUnit.MILLISECONDS);
    }

    @Test
    void isBlacklisted_withAvailableBlacklistedKey_returnsTrue() {
        when(redisTemplate.hasKey("blacklist:test-jti")).thenReturn(true);

        assertTrue(service.isBlacklisted("test-jti"));
        verify(redisTemplate).hasKey("blacklist:test-jti");
    }

    @Test
    void isBlacklisted_withNonBlacklistedKey_returnsFalse() {
        when(redisTemplate.hasKey("blacklist:test-jti")).thenReturn(false);

        assertFalse(service.isBlacklisted("test-jti"));
    }

    @Test
    void blacklist_withNullRedis_doesNotThrow() {
        @SuppressWarnings("unchecked")
        ObjectProvider<StringRedisTemplate> nullProvider = mock(ObjectProvider.class);
        when(nullProvider.getIfAvailable()).thenReturn(null);

        RedisTokenBlacklistService noRedisService = new RedisTokenBlacklistService(nullProvider);

        assertDoesNotThrow(() -> noRedisService.blacklist("test-jti", 60000L));
    }

    @Test
    void isBlacklisted_withNullRedis_returnsFalse() {
        @SuppressWarnings("unchecked")
        ObjectProvider<StringRedisTemplate> nullProvider = mock(ObjectProvider.class);
        when(nullProvider.getIfAvailable()).thenReturn(null);

        RedisTokenBlacklistService noRedisService = new RedisTokenBlacklistService(nullProvider);

        assertFalse(noRedisService.isBlacklisted("test-jti"));
    }
}
