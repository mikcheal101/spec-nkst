package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.StepUpGuardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StepUpGuardServiceTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOperations;
    @InjectMocks StepUpGuardService service;

    @Test
    void requireValidStepUp_throwsWhenMissingToken() {
        ApiException ex = assertThrows(ApiException.class, () -> service.requireValidStepUp(null, 1L));
        assertEquals("STEP_UP_REQUIRED", ex.getCode());
    }

    @Test
    void requireValidStepUp_throwsWhenTokenInvalid() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("stepup:tok")).thenReturn("2");
        ApiException ex = assertThrows(ApiException.class, () -> service.requireValidStepUp("tok", 1L));
        assertEquals("STEP_UP_INVALID", ex.getCode());
    }

    @Test
    void requireValidStepUp_deletesTokenOnSuccess() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("stepup:tok")).thenReturn("1");
        assertDoesNotThrow(() -> service.requireValidStepUp("tok", 1L));
        verify(redisTemplate).delete("stepup:tok");
    }

    @Test
    void requireValidStepUp_mapsRedisFailureToUnavailable() {
        when(redisTemplate.opsForValue()).thenThrow(new RuntimeException("redis down"));
        ApiException ex = assertThrows(ApiException.class, () -> service.requireValidStepUp("tok", 1L));
        assertEquals("STEP_UP_UNAVAILABLE", ex.getCode());
    }
}
