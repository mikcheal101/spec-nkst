package com.mikkytrionze.churchmanagement.shared.security;

import com.mikkytrionze.churchmanagement.TestCacheConfig;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.main.allow-bean-definition-overriding=true",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration"
})
@AutoConfigureMockMvc
@Import({TestCacheConfig.class, TokenRevocationIntegrationTest.RedisStubConfig.class})
class TokenRevocationIntegrationTest {

    @TestConfiguration
    static class RedisStubConfig {
        static final ConcurrentHashMap<String, String> store = new ConcurrentHashMap<>();
        @Bean @Primary
        StringRedisTemplate stringRedisTemplate() {
            StringRedisTemplate t = mock(StringRedisTemplate.class);
            ValueOperations<String, String> ops = mock(ValueOperations.class);
            when(t.opsForValue()).thenReturn(ops);
            when(t.hasKey(anyString())).thenAnswer(inv -> store.containsKey(inv.getArgument(0)));
            when(ops.get(anyString())).thenAnswer(inv -> store.get(inv.getArgument(0)));
            doAnswer(inv -> { store.put(inv.getArgument(0), inv.getArgument(1)); return null; }).when(ops).set(anyString(), anyString());
            return t;
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwtUtil;

    String accessToken(long uid, long epoch, String... authorities) {
        return jwtUtil.generateToken("test-user", 900000L, "access",
                Map.of("uid", uid, "perm_epoch", epoch, "authorities", List.of(authorities)));
    }

    @Test
    void stalePermissionEpoch_returns401_thenFreshTokenAllowedByAuthLayer() throws Exception {
        RedisStubConfig.store.clear();
        long uid = 9001L;
        String oldToken = accessToken(uid, 1L, "ROLE_ADMIN", "CHURCH:VIEW");
        // baseline 200 before revocation
        mockMvc.perform(get("/api/v1/churches").header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isOk());

        // simulate live permission/role revocation by bumping epoch in Redis
        RedisStubConfig.store.put("user:perm_epoch:" + uid, "2");

        mockMvc.perform(get("/api/v1/churches")
                        .header("Authorization", "Bearer " + oldToken)
                        .header("X-Correlation-ID", "corr-stale-1"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Correlation-ID", "corr-stale-1"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("AUTH_TOKEN_STALE"))
                .andExpect(jsonPath("$.correlationId").value("corr-stale-1"));

        // fresh token with current epoch passes auth layer -> 200
        String freshToken = accessToken(uid, 2L, "ROLE_ADMIN", "CHURCH:VIEW");
        mockMvc.perform(get("/api/v1/churches").header("Authorization", "Bearer " + freshToken))
                .andExpect(status().isOk());
    }

    @Test
    void blacklistedJti_returns401Revoked() throws Exception {
        RedisStubConfig.store.clear();
        String token = accessToken(9002L, 1L, "ROLE_ADMIN", "CHURCH:VIEW");
        String jti = jwtUtil.getTokenIdFromToken(token);
        RedisStubConfig.store.put("blacklist:" + jti, "1");

        mockMvc.perform(get("/api/v1/churches")
                        .header("Authorization", "Bearer " + token)
                        .header("X-Correlation-ID", "corr-revoked-1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("AUTH_TOKEN_REVOKED"))
                .andExpect(jsonPath("$.correlationId").value("corr-revoked-1"));
    }
}
