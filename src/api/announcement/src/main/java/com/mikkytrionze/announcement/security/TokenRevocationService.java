package com.mikkytrionze.announcement.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class TokenRevocationService {
    private final StringRedisTemplate redis;
    public TokenRevocationService(ObjectProvider<StringRedisTemplate> provider) { this.redis = provider.getIfAvailable(); }
    public boolean isBlacklisted(String jti) {
        if (redis == null || jti == null) return false;
        try { return Boolean.TRUE.equals(redis.hasKey("blacklist:" + jti)); } catch (Exception e) { return false; }
    }
    public boolean isEpochStale(Long userId, Long tokenEpoch) {
        if (redis == null || userId == null || tokenEpoch == null) return false;
        try { String v = redis.opsForValue().get("user:perm_epoch:" + userId); return v != null && tokenEpoch < Long.parseLong(v); } catch (Exception e) { return false; }
    }
}
