package com.mikkytrionze.announcement;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;

@TestConfiguration
public class TestInfraConfig {
    @Bean
    @Primary
    StringRedisTemplate stringRedisTemplate() {
        StringRedisTemplate template = Mockito.mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = Mockito.mock(ValueOperations.class);
        lenient().when(template.opsForValue()).thenReturn(ops);
        lenient().when(template.hasKey(anyString())).thenReturn(false);
        lenient().when(ops.get(anyString())).thenReturn(null);
        return template;
    }
}
