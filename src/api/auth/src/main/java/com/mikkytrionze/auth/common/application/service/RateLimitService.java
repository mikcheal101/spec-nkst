package com.mikkytrionze.auth.common.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {
    private final RateLimitConfig config;
    private final StringRedisTemplate redisTemplate;
    private final ConcurrentHashMap<String, WindowCounter> local = new ConcurrentHashMap<>();

    public void check(String key, int max, int windowMinutes) {
        int retryAfter = windowMinutes * 60;
        boolean allowed;
        try {
            if ("memory".equalsIgnoreCase(config.getStore())) allowed = checkLocal(key, max, windowMinutes);
            else allowed = checkRedis(key, max, windowMinutes);
        } catch (Exception e) {
            log.warn("Rate limit store unavailable, using local fallback: {}", e.getMessage());
            allowed = checkLocal(key, max, windowMinutes); // local/test fallback; production should be configured to fail closed by policy
        }
        if (!allowed) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "Too many requests", Map.of("retryAfterSeconds", retryAfter));
        }
    }

    private boolean checkRedis(String key, int max, int windowMinutes) {
        String redisKey = "rl:" + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);
        if (count != null && count == 1L) redisTemplate.expire(redisKey, Duration.ofMinutes(windowMinutes));
        return count != null && count <= max;
    }

    private boolean checkLocal(String key, int max, int windowMinutes) {
        long now = System.currentTimeMillis();
        long windowMs = Duration.ofMinutes(windowMinutes).toMillis();
        WindowCounter c = local.compute(key, (k, v) -> {
            if (v == null || now - v.windowStart >= windowMs) return new WindowCounter(now, new AtomicInteger(1));
            v.count.incrementAndGet();
            return v;
        });
        return c.count.get() <= max;
    }

    private record WindowCounter(long windowStart, AtomicInteger count) {}
}
