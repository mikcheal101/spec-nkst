package com.mikkytrionze.auth.integration;

import com.mikkytrionze.auth.common.domain.model.SystemConfiguration;
import com.mikkytrionze.auth.common.domain.repository.AuditLogRepository;
import com.mikkytrionze.auth.common.domain.repository.SystemConfigurationRepository;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.main.allow-bean-definition-overriding=true",
        "spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration,org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@AutoConfigureMockMvc
@Import(AuthLifecycleGovernanceIntegrationTest.RedisStubConfig.class)
class AuthLifecycleGovernanceIntegrationTest {

    @TestConfiguration
    static class RedisStubConfig {
        static final ConcurrentHashMap<String, String> store = new ConcurrentHashMap<>();
        @Bean @Primary
        StringRedisTemplate stringRedisTemplate() {
            StringRedisTemplate t = mock(StringRedisTemplate.class);
            ValueOperations<String, String> ops = mock(ValueOperations.class);
            ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();
            lenient().when(t.opsForValue()).thenReturn(ops);
            lenient().when(ops.get(anyString())).thenAnswer(inv -> store.get(inv.getArgument(0)));
            lenient().doAnswer(inv -> { store.put(inv.getArgument(0), inv.getArgument(1)); return null; }).when(ops).set(anyString(), anyString());
            lenient().doAnswer(inv -> { store.put(inv.getArgument(0), inv.getArgument(1)); return null; }).when(ops).set(anyString(), anyString(), org.mockito.ArgumentMatchers.<Duration>any());
            lenient().when(t.delete(anyString())).thenAnswer(inv -> store.remove((String)inv.getArgument(0)) != null);
            lenient().when(t.hasKey(anyString())).thenAnswer(inv -> store.containsKey(inv.getArgument(0)));
            lenient().when(ops.increment(anyString())).thenAnswer(inv -> counters.computeIfAbsent(inv.getArgument(0), k -> new AtomicLong()).incrementAndGet());
            lenient().when(t.expire(anyString(), org.mockito.ArgumentMatchers.<Duration>any())).thenReturn(true);
            return t;
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PermissionRepository permissionRepository;
    @Autowired AuditLogRepository auditLogRepository;
    @Autowired SystemConfigurationRepository systemConfigurationRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        RedisStubConfig.store.clear();
        ensurePerm("SETTINGS:READ", "can_read_settings");
        ensurePerm("SETTINGS:UPDATE", "can_update_settings");
    }

    Permission ensurePerm(String key, String name) {
        return permissionRepository.findByKey(key).orElseGet(() -> permissionRepository.save(Permission.builder().key(key).name(name).build()));
    }
    User ensureUser(String username, AccountStatus status, String... permKeys) {
        User u = userRepository.findByUsername(username).orElseGet(() -> User.builder().username(username).password(passwordEncoder.encode("Password123!")).accountStatus(status).permissionEpoch(0L).roles(new HashSet<>()).permissions(new HashSet<>()).build());
        u.setAccountStatus(status);
        u.setPassword(passwordEncoder.encode("Password123!"));
        Set<Permission> ps = new HashSet<>();
        for (String k : permKeys) permissionRepository.findByKey(k).ifPresent(ps::add);
        u.setPermissions(ps);
        return userRepository.save(u);
    }
    String signIn(String u) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/auth/sign-in").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\""+u+"\",\"password\":\"Password123!\"}")).andExpect(status().isOk()).andReturn();
        String b = r.getResponse().getContentAsString();
        int i = b.indexOf("\"accessToken\":\"") + 15; return b.substring(i, b.indexOf('"', i));
    }

    @Test
    void suspendedUser_cannotSignIn_andDisabledUserCannotSignIn() throws Exception {
        ensureUser("suspended-u", AccountStatus.SUSPENDED);
        ensureUser("disabled-u", AccountStatus.DISABLED);

        mockMvc.perform(post("/api/v1/auth/sign-in").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"suspended-u\",\"password\":\"Password123!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_NOT_ELIGIBLE"));

        mockMvc.perform(post("/api/v1/auth/sign-in").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"disabled-u\",\"password\":\"Password123!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_NOT_ELIGIBLE"));
    }

    @Test
    void profilePasswordChange_requiresStepUp_invalidatesSessions_andAudits() throws Exception {
        User u = ensureUser("profile-u", AccountStatus.ACTIVE);
        String token = signIn("profile-u");
        // no step-up token -> 403
        mockMvc.perform(post("/api/v1/profile/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Password123!\",\"newPassword\":\"NewPass123!\"}"))
                .andExpect(status().isForbidden());

        String stepUp = UUID.randomUUID().toString();
        RedisStubConfig.store.put("stepup:" + stepUp, String.valueOf(u.getId()));

        mockMvc.perform(post("/api/v1/profile/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Password123!\",\"newPassword\":\"NewPass123!\",\"stepUpToken\":\""+stepUp+"\"}"))
                .andExpect(status().isNoContent());

        User refreshed = userRepository.findById(u.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("NewPass123!", refreshed.getPassword()));
        assertTrue(refreshed.getPermissionEpoch() >= 1L || RedisStubConfig.store.containsKey("user:perm_epoch:" + u.getId()));
        assertTrue(auditLogRepository.findAll().stream().anyMatch(a -> "PROFILE_PASSWORD_CHANGE".equals(a.getAction()) && "SUCCESS".equals(a.getOutcome())));
    }

    @Test
    void systemConfiguration_upsertRequiresAuthority_andAudits() throws Exception {
        ensureUser("settings-u", AccountStatus.ACTIVE, "SETTINGS:READ", "SETTINGS:UPDATE");
        String token = signIn("settings-u");

        mockMvc.perform(put("/api/v1/system-configurations/{key}", "auth.session.ttl")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\":\"900\",\"description\":\"session ttl\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configKey").value("auth.session.ttl"))
                .andExpect(jsonPath("$.configValue").value("900"));

        SystemConfiguration cfg = systemConfigurationRepository.findByConfigKey("auth.session.ttl").orElseThrow();
        assertEquals("900", cfg.getConfigValue());
        assertTrue(auditLogRepository.findAll().stream().anyMatch(a -> "SYSTEM_CONFIG_UPSERT".equals(a.getAction()) && "SUCCESS".equals(a.getOutcome())));
    }
}
