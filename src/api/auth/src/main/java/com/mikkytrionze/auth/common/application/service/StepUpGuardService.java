package com.mikkytrionze.auth.common.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StepUpGuardService {
    private final StringRedisTemplate redisTemplate;

    public void requireValidStepUp(String token, Long userId) {
        if (token == null || token.isBlank()) throw new ApiException(HttpStatus.FORBIDDEN, "STEP_UP_REQUIRED", "Step-up confirmation required");
        try {
            String val = redisTemplate.opsForValue().get("stepup:" + token);
            if (val == null || !val.equals(String.valueOf(userId))) {
                throw new ApiException(HttpStatus.FORBIDDEN, "STEP_UP_INVALID", "Step-up confirmation invalid or expired");
            }
            redisTemplate.delete("stepup:" + token);
        } catch (ApiException e) { throw e; }
        catch (Exception e) { throw new ApiException(HttpStatus.FORBIDDEN, "STEP_UP_UNAVAILABLE", "Step-up confirmation unavailable"); }
    }
}
