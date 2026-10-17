package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.user.domain.service.TokenBlacklistService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RedisTokenBlacklistService implements TokenBlacklistService {

    private static final String BLACKLIST_KEY_PREFIX = "blacklist:";

    private final StringRedisTemplate redisTemplate;

    public RedisTokenBlacklistService(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        if (this.redisTemplate == null) {
            log.warn("Redis not available — token blacklisting is disabled");
        }
    }

    @Override
    public void blacklist(String jti, long ttlMillis) {
        if (redisTemplate == null) {
            log.warn("Cannot blacklist token {} — Redis unavailable", jti);
            return;
        }
        String key = BLACKLIST_KEY_PREFIX + jti;
        redisTemplate.opsForValue().set(key, "1", ttlMillis, TimeUnit.MILLISECONDS);
        log.info("Token blacklisted: {}", jti);
    }

    @Override
    public boolean isBlacklisted(String jti) {
        if (redisTemplate == null) {
            return false;
        }
        String key = BLACKLIST_KEY_PREFIX + jti;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
