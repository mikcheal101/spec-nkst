package com.mikkytrionze.auth.integration;

import com.mikkytrionze.auth.TestInfraConfig;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "auth.ratelimit.store=local",
        "auth.ratelimit.signin.max-attempts=100",
        "auth.ratelimit.signin.window-minutes=15",
        "auth.ratelimit.refresh.max-requests=100",
        "auth.ratelimit.refresh.window-minutes=15",
        "church.features.memberSelfService=true",
        "spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration,org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@AutoConfigureMockMvc
@Import(TestInfraConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthContractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig rateLimitConfig;
    @Autowired com.mikkytrionze.infrastructure.jwt.JwtUtil jwtUtil;

    static String accessToken;
    static String refreshToken;

    @BeforeEach
    void ensureUser() {
        if (userRepository.findByUsername("itest-admin").isEmpty()) {
            User u = User.builder()
                    .username("itest-admin")
                    .password(passwordEncoder.encode("Password123!"))
                    .accountStatus(AccountStatus.ACTIVE)
                    .permissionEpoch(0L)
                    .build();
            userRepository.save(u);
        }
    }

    @Test @Order(1)
    void signIn_validCredentials_returns200WithTokensAndCorrelationId() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Correlation-ID", "corr-signin-1")
                        .content("{\"username\":\"itest-admin\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-ID", "corr-signin-1"))
                .andExpect(jsonPath("$.accessToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.refreshToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.tokenType").exists())
                .andReturn();
        String body = r.getResponse().getContentAsString();
        accessToken = extract(body, "accessToken");
        refreshToken = extract(body, "refreshToken");
    }

    @Test @Order(2)
    void signIn_invalidCredentials_returns401StandardizedError() throws Exception {
        mockMvc.perform(post("/api/v1/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"itest-admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Correlation-ID", not(emptyOrNullString())))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/sign-in"))
                .andExpect(jsonPath("$.correlationId", not(emptyOrNullString())))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test @Order(3)
    void signIn_validationFailure_returns400StandardizedError() throws Exception {
        mockMvc.perform(post("/api/v1/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.correlationId", not(emptyOrNullString())))
                .andExpect(jsonPath("$.details").exists());
    }

    @Test @Order(4)
    void refresh_validToken_returns200() throws Exception {
        MvcResult signIn = mockMvc.perform(post("/api/v1/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"itest-admin\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk()).andReturn();
        String rt = extract(signIn.getResponse().getContentAsString(), "refreshToken");
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + rt + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.refreshToken", not(emptyOrNullString())));
    }

    @Test @Order(5)
    void refresh_missingToken_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.correlationId", not(emptyOrNullString())));
    }

    @Test @Order(6)
    void signOut_validRequest_returns200() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"itest-admin\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk()).andReturn();
        String body = r.getResponse().getContentAsString();
        String at = extract(body, "accessToken");
        String rt = extract(body, "refreshToken");
        mockMvc.perform(post("/api/v1/auth/sign-out")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accessToken\":\"" + at + "\",\"refreshToken\":\"" + rt + "\"}"))
                .andExpect(status().isOk());
    }

    @Test @Order(7)
    void signOut_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/sign-out")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accessToken\":\"\",\"refreshToken\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test @Order(8)
    void stepUp_invalidPassword_returns401WithContract() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"itest-admin\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk()).andReturn();
        String at = extract(r.getResponse().getContentAsString(), "accessToken");
        mockMvc.perform(post("/api/v1/auth/step-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + at)
                        .content("{\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.correlationId", not(emptyOrNullString())));
    }

    @Test @Order(9)
    void rateLimit_signIn_returns429WithRetryAfter() throws Exception {
        int prev = rateLimitConfig.getSigninMaxAttempts();
        rateLimitConfig.setSigninMaxAttempts(3);
        try {
            String u = "ratelimit-user";
            if (userRepository.findByUsername(u).isEmpty()) {
                userRepository.save(User.builder().username(u).password(passwordEncoder.encode("Password123!")).accountStatus(AccountStatus.ACTIVE).permissionEpoch(0L).build());
            }
            for (int i = 0; i < 3; i++) {
                mockMvc.perform(post("/api/v1/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\""+u+"\",\"password\":\"bad\"}"))
                        .andExpect(status().isUnauthorized());
            }
            mockMvc.perform(post("/api/v1/auth/sign-in")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\""+u+"\",\"password\":\"bad\"}"))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(header().exists("Retry-After"))
                    .andExpect(jsonPath("$.status").value(429))
                    .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                    .andExpect(jsonPath("$.correlationId", not(emptyOrNullString())))
                    .andExpect(jsonPath("$.details.retryAfterSeconds").exists());
        } finally {
            rateLimitConfig.setSigninMaxAttempts(prev);
        }
    }

    @Test @Order(10)
    void expiredAccessToken_returns401StandardizedContract() throws Exception {
        String expired = jwtUtil.generateToken("itest-admin", -60000L, "access",
                java.util.Map.of("uid", 2, "perm_epoch", 0L, "authorities", java.util.List.of()));
        mockMvc.perform(post("/api/v1/auth/step-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + expired)
                        .content("{\"password\":\"Password123!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.correlationId", not(emptyOrNullString())));
    }

    @Test @Order(11)
    void expiredOrInvalidRefreshToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"not-a-valid-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.correlationId", not(emptyOrNullString())));
    }

    private static String extract(String json, String field) {
        String needle = "\"" + field + "\":\"";
        int i = json.indexOf(needle);
        if (i < 0) return null;
        int start = i + needle.length();
        int end = json.indexOf('"', start);
        return json.substring(start, end);
    }
}
