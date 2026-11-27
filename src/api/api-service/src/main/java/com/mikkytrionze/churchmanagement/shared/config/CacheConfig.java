package com.mikkytrionze.churchmanagement.shared.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class CacheConfig {

    @Bean
    @org.springframework.boot.autoconfigure.condition.ConditionalOnBean(RedisConnectionFactory.class)
    @org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean(CacheManager.class)
    public RedisCacheManager redisCacheManager(RedisConnectionFactory redisConnectionFactory, ObjectMapper objectMapper) {

        Map<String, RedisCacheConfiguration> cacheConfigurationMap = new HashMap<>();

        GenericJacksonJsonRedisSerializer jsonSerializer = GenericJacksonJsonRedisSerializer
                .builder(() -> objectMapper.rebuild())
                .enableSpringCacheNullValueSupport()
                .enableUnsafeDefaultTyping()
                .build();

        RedisCacheConfiguration baseConfiguration = RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext
                        .SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext
                        .SerializationPair
                        .fromSerializer(jsonSerializer));

        cacheConfigurationMap.put(
                "churches",
                baseConfiguration
                        .entryTtl(Duration.ofHours(10)));

        cacheConfigurationMap.put(
                "pastors",
                baseConfiguration
                        .entryTtl(Duration.ofHours(1)));

        return RedisCacheManager
                .builder(redisConnectionFactory)
                .cacheDefaults(baseConfiguration)
                .withInitialCacheConfigurations(cacheConfigurationMap)
                .build();
    }

    @Bean
    @org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean(CacheManager.class)
    public CacheManager fallbackCacheManager() {
        return new ConcurrentMapCacheManager();
    }
}
