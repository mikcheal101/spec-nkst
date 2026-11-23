package performance;

import com.mikkytrionze.auth.ChurchManagementApplication;

import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ChurchManagementApplication.class, webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "spring.main.allow-bean-definition-overriding=true",
        "auth.ratelimit.signin.max-attempts=1000",
        "auth.ratelimit.signin.window-minutes=1",
        "spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration,org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@AutoConfigureMockMvc
@Import(AuthPerformanceBudgetTest.RedisStubConfig.class)
class AuthPerformanceBudgetTest {

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
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired EntityManagerFactory emf;

    record Sample(long ms, long queries) {}
    record Report(double p50, double p95, long maxMs, double avgQueries, long maxQueries) {}

    @BeforeEach
    void setUp() {
        RedisStubConfig.store.clear();
        // reset rate limit counters by clearing store; counters are in bean, so use unique usernames per run where needed
        ensurePerm("ROLES:VIEW", "can_view_roles");
        ensurePerm("ROLES:UPDATE", "can_update_roles");
        ensurePerm("SETTINGS:READ", "can_read_settings");
        ensureUser("perf-admin", Set.of("ROLES:VIEW","ROLES:UPDATE","SETTINGS:READ"));
    }

    Permission ensurePerm(String key, String name) {
        return permissionRepository.findByKey(key).orElseGet(() -> permissionRepository.save(Permission.builder().key(key).name(name).active(true).build()));
    }
    void ensureUser(String username, Set<String> perms) {
        User u = userRepository.findByUsername(username).orElseGet(() -> User.builder().username(username).password(passwordEncoder.encode("Password123!")).accountStatus(AccountStatus.ACTIVE).permissionEpoch(0L).roles(new HashSet<>()).permissions(new HashSet<>()).build());
        u.setPassword(passwordEncoder.encode("Password123!"));
        u.setAccountStatus(AccountStatus.ACTIVE);
        Set<Permission> ps = new HashSet<>();
        for (String k : perms) permissionRepository.findByKey(k).ifPresent(ps::add);
        u.setPermissions(ps);
        userRepository.save(u);
    }

    Statistics stats() { return emf.unwrap(SessionFactory.class).getStatistics(); }

    Report measure(int warmup, int samples, ThrowingRunnable action) throws Exception {
        for (int i=0; i<warmup; i++) action.run();
        List<Sample> out = new ArrayList<>();
        for (int i=0; i<samples; i++) {
            stats().clear();
            long t0 = System.nanoTime();
            action.run();
            long ms = (System.nanoTime() - t0) / 1_000_000;
            out.add(new Sample(ms, stats().getPrepareStatementCount()));
        }
        List<Long> ms = out.stream().map(Sample::ms).sorted().toList();
        long maxMs = ms.get(ms.size()-1);
        double p50 = percentile(ms, 50);
        double p95 = percentile(ms, 95);
        double avgQ = out.stream().mapToLong(Sample::queries).average().orElse(0);
        long maxQ = out.stream().mapToLong(Sample::queries).max().orElse(0);
        return new Report(p50, p95, maxMs, avgQ, maxQ);
    }

    double percentile(List<Long> sorted, int p) {
        if (sorted.isEmpty()) return 0;
        double idx = (p / 100.0) * (sorted.size() - 1);
        int lo = (int) Math.floor(idx), hi = (int) Math.ceil(idx);
        if (lo == hi) return sorted.get(lo);
        return sorted.get(lo) + (sorted.get(hi)-sorted.get(lo)) * (idx-lo);
    }

    @FunctionalInterface interface ThrowingRunnable { void run() throws Exception; }

    String signIn() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/auth/sign-in").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"perf-admin\",\"password\":\"Password123!\"}")).andExpect(status().isOk()).andReturn();
        String b = r.getResponse().getContentAsString();
        int i = b.indexOf("\"accessToken\":\"") + 15;
        return b.substring(i, b.indexOf('"', i));
    }

    @Test
    void signIn_latencyAndQueryBudget() throws Exception {
        Report r = measure(1, 20, () -> mockMvc.perform(post("/api/v1/auth/sign-in").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"perf-admin\",\"password\":\"Password123!\"}")).andExpect(status().isOk()));
        System.out.println("METRIC auth.signIn p50=" + r.p50 + "ms p95=" + r.p95 + "ms max=" + r.maxMs + "ms avgQueries=" + r.avgQueries + " maxQueries=" + r.maxQueries);
        assertTrue(r.p95 <= 500, "p95 budget exceeded: " + r);
        assertTrue(r.maxQueries <= 20, "query budget exceeded: " + r);
    }

    @Test
    void permissionResolution_latencyAndQueryBudget() throws Exception {
        String token = signIn();
        Report r = measure(1, 20, () -> mockMvc.perform(get("/api/v1/me/permissions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()));
        System.out.println("METRIC auth.permissionResolution p50=" + r.p50 + "ms p95=" + r.p95 + "ms max=" + r.maxMs + "ms avgQueries=" + r.avgQueries + " maxQueries=" + r.maxQueries);
        assertTrue(r.p95 <= 300, "p95 budget exceeded: " + r);
        assertTrue(r.maxQueries <= 15, "query budget exceeded: " + r);
    }

    @Test
    void governedMutation_latencyAndQueryBudget() throws Exception {
        String token = signIn();
        // create target user for mutation
        User target = userRepository.findByUsername("perf-target").orElseGet(() -> {
            User u = User.builder().username("perf-target").password(passwordEncoder.encode("Password123!"))
                    .accountStatus(AccountStatus.ACTIVE).permissionEpoch(0L).roles(new HashSet<>()).permissions(new HashSet<>()).build();
            return userRepository.save(u);
        });
        String targetId = String.valueOf(target.getId());
        Report r = measure(1, 15, () -> mockMvc.perform(patch("/api/v1/users/{id}/status", targetId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISABLED\",\"stepUpToken\":\"\"}"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    // 204 success or 403 step-up required are both governed mutation responses; budget still measured
                    assertTrue(s == 204 || s == 403, "Unexpected status: " + s);
                }));
        System.out.println("METRIC auth.governedMutation p50=" + r.p50 + "ms p95=" + r.p95 + "ms max=" + r.maxMs + "ms avgQueries=" + r.avgQueries + " maxQueries=" + r.maxQueries);
        assertTrue(r.p95 <= 500, "p95 budget exceeded: " + r);
        assertTrue(r.maxQueries <= 30, "query budget exceeded: " + r);
    }
}
