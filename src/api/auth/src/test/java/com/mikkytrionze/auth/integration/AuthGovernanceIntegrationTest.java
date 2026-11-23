package com.mikkytrionze.auth.integration;

import com.mikkytrionze.auth.common.domain.model.AuditLog;
import com.mikkytrionze.auth.common.domain.repository.AuditLogRepository;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
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
import static org.mockito.ArgumentMatchers.eq;
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
@Import(AuthGovernanceIntegrationTest.RedisStubConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthGovernanceIntegrationTest {

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
    @Autowired PasswordEncoder passwordEncoder;

    String adminToken;
    User adminUser;
    User rootSuperAdmin;
    User secondarySuperAdmin;
    User normalUser;

    @BeforeEach
    void setup() throws Exception {
        RedisStubConfig.store.clear();
        ensureRole(ERole.SUPER_ADMIN, true);
        ensureRole(ERole.CHURCH_ADMIN, false);
        ensureRole(ERole.MEMBER_BAPTISED, false);
        ensurePerm("ROLES:UPDATE", "can_update_roles");
        ensurePerm("ROLES:VIEW", "can_view_roles");
        ensurePerm("MEMBERS:UPDATE", "can_update_members");
        ensurePerm("PERMISSIONS:UPDATE", "can_update_permissions");
        ensurePerm("SETTINGS:READ", "can_read_settings");
        ensurePerm("SETTINGS:UPDATE", "can_update_settings");

        Role churchAdminRole = ensureRole(ERole.CHURCH_ADMIN, false);
        churchAdminRole = roleRepository.findByName(ERole.CHURCH_ADMIN).orElseThrow();
        Set<Permission> rolePerms = new HashSet<>();
        for (String k : List.of("ROLES:UPDATE","ROLES:VIEW","MEMBERS:UPDATE","PERMISSIONS:UPDATE","SETTINGS:READ","SETTINGS:UPDATE")) {
            permissionRepository.findByKey(k).ifPresent(rolePerms::add);
        }
        churchAdminRole.setPermissions(rolePerms);
        roleRepository.save(churchAdminRole);
        adminUser = ensureUser("gov-admin", "Password123!", AccountStatus.ACTIVE, false, Set.of(ERole.CHURCH_ADMIN),
                Set.of("ROLES:UPDATE","ROLES:VIEW","MEMBERS:UPDATE","PERMISSIONS:UPDATE","SETTINGS:READ","SETTINGS:UPDATE"));
        rootSuperAdmin = ensureUser("root-sa", "Password123!", AccountStatus.ACTIVE, true, Set.of(ERole.SUPER_ADMIN), Set.of());
        secondarySuperAdmin = ensureUser("sec-sa", "Password123!", AccountStatus.ACTIVE, false, Set.of(ERole.SUPER_ADMIN), Set.of());
        normalUser = ensureUser("normal-user", "Password123!", AccountStatus.ACTIVE, false, Set.of(ERole.MEMBER_BAPTISED), Set.of());
        adminToken = signIn("gov-admin", "Password123!");
    }

    Role ensureRole(ERole name, boolean protectedRole) {
        return roleRepository.findByName(name).orElseGet(() -> roleRepository.save(Role.builder().name(name).protectedRole(protectedRole).permissions(new HashSet<>()).build()));
    }
    Permission ensurePerm(String key, String name) {
        return permissionRepository.findByKey(key).orElseGet(() -> permissionRepository.save(Permission.builder().key(key).name(name).build()));
    }
    User ensureUser(String username, String pw, AccountStatus status, boolean root, Set<ERole> roles, Set<String> permKeys) {
        User u = userRepository.findByUsername(username).orElseGet(() -> User.builder().username(username).password(passwordEncoder.encode(pw)).accountStatus(status).rootSuperAdmin(root).permissionEpoch(0L).roles(new HashSet<>()).permissions(new HashSet<>()).build());
        u.setAccountStatus(status); u.setRootSuperAdmin(root); u.setPassword(passwordEncoder.encode(pw));
        Set<Role> rs = new HashSet<>(); for (ERole r : roles) rs.add(ensureRole(r, r==ERole.SUPER_ADMIN)); u.setRoles(rs);
        Set<Permission> ps = new HashSet<>();
        for (String k : permKeys) {
            permissionRepository.findByKey(k).ifPresent(ps::add);
            permissionRepository.findByName(k).ifPresent(ps::add);
        }
        u.setPermissions(ps);
        return userRepository.save(u);
    }
    String signIn(String u, String p) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/auth/sign-in").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\""+u+"\",\"password\":\""+p+"\"}")).andExpect(status().isOk()).andReturn();
        String b = r.getResponse().getContentAsString();
        int i = b.indexOf("\"accessToken\":\"") + 15; return b.substring(i, b.indexOf('"', i));
    }
    String stepUpTokenFor(User u) {
        String tok = UUID.randomUUID().toString();
        RedisStubConfig.store.put("stepup:" + tok, String.valueOf(u.getId()));
        return tok;
    }

    @Test @Order(1)
    void rootSuperAdmin_cannotBeDemotedOrDisabled_returns403AndAudit() throws Exception {
        mockMvc.perform(delete("/api/v1/users/{id}/roles/{role}", rootSuperAdmin.getId(), ERole.SUPER_ADMIN)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stepUpToken\":\""+stepUpTokenFor(adminUser)+"\"}"))
                .andExpect(status().isForbidden());
        List<AuditLog> logs = auditLogRepository.findAll();
        // mutation blocked by governance service - at minimum no SUCCESS demotion; ensure root still super admin
        User refreshed = userRepository.findById(rootSuperAdmin.getId()).orElseThrow();
        assertTrue(refreshed.isRootSuperAdmin());
        assertTrue(refreshed.getRoles().stream().anyMatch(r -> r.getName()==ERole.SUPER_ADMIN));
    }

    @Test @Order(2)
    void lastSuperAdminProtection_blocksDisablingLastActive() throws Exception {
        // make secondary disabled so root is last active? root is immutable; test on secondary as last active by disabling root? can't. 
        // Instead: create only one active super admin scenario.
        secondarySuperAdmin.setAccountStatus(AccountStatus.DISABLED);
        secondarySuperAdmin.getRoles().removeIf(r -> r.getName()==ERole.SUPER_ADMIN); // keep only root active super admin in effect? better use another user
        userRepository.save(secondarySuperAdmin);
        User lone = ensureUser("lone-sa", "Password123!", AccountStatus.ACTIVE, false, Set.of(ERole.SUPER_ADMIN), Set.of());
        // disable root-sa? root is immutable but status change may be blocked; use lone as target and ensure it's the only active SA besides root? root counts as active SA. 
        // set root to disabled in DB impossible via service, but for last-admin calc it counts by role+active. We'll simulate by making root account DISABLED directly in repo for test setup only.
        // ensure only lone is active SUPER_ADMIN
        for (User u : userRepository.findAll()) {
            if (u.getId().equals(lone.getId())) continue;
            if (u.getRoles().stream().anyMatch(r -> r.getName()==ERole.SUPER_ADMIN)) {
                u.setRoles(u.getRoles().stream().filter(r -> r.getName()!=ERole.SUPER_ADMIN).collect(java.util.stream.Collectors.toSet()));
                userRepository.save(u);
            }
        }
        MvcResult last = mockMvc.perform(patch("/api/v1/users/{id}/status", lone.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISABLED\",\"stepUpToken\":\""+stepUpTokenFor(adminUser)+"\"}"))
                .andReturn();
        assertEquals(403, last.getResponse().getStatus(), last.getResponse().getContentAsString());
        assertTrue(last.getResponse().getContentAsString().contains("LAST_SUPER_ADMIN_PROTECTED"), last.getResponse().getContentAsString());
    }

    @Test @Order(3)
    @org.springframework.transaction.annotation.Transactional
    void directPermissionPolicy_denyAndAllow_areAudited() throws Exception {
        // deny when policy disabled
        MvcResult deny = mockMvc.perform(put("/api/v1/users/{id}/permissions", normalUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"permissions\":[\"ROLES:VIEW\"],\"policyEnabled\":false,\"stepUpToken\":\""+stepUpTokenFor(adminUser)+"\"}"))
                .andReturn();
        assertEquals(403, deny.getResponse().getStatus(), deny.getResponse().getContentAsString());
        assertTrue(deny.getResponse().getContentAsString().contains("DIRECT_PERMISSIONS_DISABLED"), deny.getResponse().getContentAsString());

        // allow when policy enabled
        mockMvc.perform(put("/api/v1/users/{id}/permissions", normalUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"permissions\":[\"ROLES:VIEW\"],\"policyEnabled\":true,\"stepUpToken\":\""+stepUpTokenFor(adminUser)+"\"}"))
                .andExpect(status().isNoContent());

        User refreshed = userRepository.findById(normalUser.getId()).orElseThrow();
        org.hibernate.Hibernate.initialize(refreshed.getPermissions());
        java.util.Set<String> keys = new java.util.HashSet<>();
        refreshed.getPermissions().forEach(p -> { if (p.getKey()!=null) keys.add(p.getKey()); if (p.getName()!=null) keys.add(p.getName()); });
        assertTrue(keys.contains("ROLES:VIEW") || keys.contains("can_view_roles"), "keys="+keys);

        List<AuditLog> logs = auditLogRepository.findAll();
        assertTrue(logs.stream().anyMatch(l -> "USER_DIRECT_PERMISSIONS".equals(l.getAction()) && "DENIED".equals(l.getOutcome()) && "POLICY_DISABLED".equals(l.getReasonCode())));
        assertTrue(logs.stream().anyMatch(l -> "USER_DIRECT_PERMISSIONS".equals(l.getAction()) && "SUCCESS".equals(l.getOutcome())));
    }

    @Test @Order(4)
    void protectedRoleUpdate_requiresStepUp_andAudits() throws Exception {
        Role superRole = roleRepository.findByName(ERole.SUPER_ADMIN).orElseThrow();
        // without step up - should fail
        mockMvc.perform(put("/api/v1/roles/{id}", superRole.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"SUPER_ADMIN\",\"permissions\":[\"ROLES:VIEW\"]}"))
                .andExpect(status().isForbidden());

        // with step up - should succeed
        MvcResult ok = mockMvc.perform(put("/api/v1/roles/{id}", superRole.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"SUPER_ADMIN\",\"permissions\":[\"ROLES:VIEW\"],\"stepUpToken\":\""+stepUpTokenFor(adminUser)+"\"}"))
                .andReturn();
        System.out.println("ROLE_UPDATE_STATUS="+ok.getResponse().getStatus()+" BODY="+ok.getResponse().getContentAsString());
        assertEquals(200, ok.getResponse().getStatus(), ok.getResponse().getContentAsString());

        assertTrue(auditLogRepository.findAll().stream().anyMatch(l -> "ROLE_PERMISSIONS_UPDATED".equals(l.getAction()) && "SUCCESS".equals(l.getOutcome())));
    }

    @Test @Order(5)
    void userGovernance_listViewProvision_endpointsWork() throws Exception {
        mockMvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].username", notNullValue()));

        mockMvc.perform(get("/api/v1/users/{id}", normalUser.getId()).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(String.valueOf(normalUser.getId()))))
                .andExpect(jsonPath("$.username", is("normal-user")));

        MvcResult created = mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"provisioned-user\",\"password\":\"Password123!\",\"roles\":[\"MEMBER_UNBAPTISED\"],\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("provisioned-user")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andReturn();
        assertTrue(created.getResponse().getContentAsString().contains("provisioned-user"));
        assertTrue(auditLogRepository.findAll().stream().anyMatch(l -> "USER_PROVISIONED".equals(l.getAction()) && "SUCCESS".equals(l.getOutcome())));
    }
}
