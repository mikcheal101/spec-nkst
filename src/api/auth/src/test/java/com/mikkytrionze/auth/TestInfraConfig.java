package com.mikkytrionze.auth;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

@TestConfiguration
public class TestInfraConfig {
    @Bean
    @Primary
    StringRedisTemplate stringRedisTemplate() {
        StringRedisTemplate template = Mockito.mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = Mockito.mock(ValueOperations.class);
        java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicLong> counters = new java.util.concurrent.ConcurrentHashMap<>();
        lenient().when(template.opsForValue()).thenReturn(ops);
        lenient().when(template.hasKey(anyString())).thenReturn(false);
        lenient().when(ops.get(anyString())).thenReturn(null);
        lenient().when(ops.increment(anyString())).thenAnswer(inv -> counters.computeIfAbsent(inv.getArgument(0), k -> new java.util.concurrent.atomic.AtomicLong()).incrementAndGet());
        lenient().when(template.expire(anyString(), any(java.time.Duration.class))).thenReturn(true);
        return template;
    }

    @Bean
    @Primary
    org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate() {
        return Mockito.mock(org.springframework.kafka.core.KafkaTemplate.class);
    }
}
