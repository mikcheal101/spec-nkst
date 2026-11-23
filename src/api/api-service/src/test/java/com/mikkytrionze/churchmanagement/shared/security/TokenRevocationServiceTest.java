package com.mikkytrionze.churchmanagement.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TokenRevocationServiceTest {

    @Test
    void isBlacklisted_returnsTrueWhenRedisHasKey() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.hasKey("blacklist:jti-1")).thenReturn(true);
        TokenRevocationService svc = new TokenRevocationService(provider);

        assertTrue(svc.isBlacklisted("jti-1"));
    }

    @Test
    void isBlacklisted_returnsFalseWhenRedisUnavailable() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        TokenRevocationService svc = new TokenRevocationService(provider);

        assertFalse(svc.isBlacklisted("jti-1"));
    }

    @Test
    void isEpochStale_returnsTrueWhenTokenEpochOlderThanCurrent() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("user:perm_epoch:7")).thenReturn("3");
        TokenRevocationService svc = new TokenRevocationService(provider);

        assertTrue(svc.isEpochStale(7L, 2L));
    }

    @Test
    void isEpochStale_returnsFalseWhenTokenEpochCurrent() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get("user:perm_epoch:7")).thenReturn("2");
        TokenRevocationService svc = new TokenRevocationService(provider);

        assertFalse(svc.isEpochStale(7L, 2L));
    }

    @Test
    void isEpochStale_returnsFalseOnRedisFailure() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenThrow(new RuntimeException("redis down"));
        TokenRevocationService svc = new TokenRevocationService(provider);

        assertFalse(svc.isEpochStale(7L, 2L));
    }
}
