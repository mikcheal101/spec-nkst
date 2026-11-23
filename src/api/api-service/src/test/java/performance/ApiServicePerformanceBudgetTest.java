package performance;

import com.mikkytrionze.churchmanagement.ChurchManagementApplication;

import com.mikkytrionze.churchmanagement.TestCacheConfig;
import com.mikkytrionze.churchmanagement.church.domain.model.Church;
import com.mikkytrionze.churchmanagement.church.domain.model.UserChurchScope;
import com.mikkytrionze.churchmanagement.church.domain.repository.ChurchRepository;
import com.mikkytrionze.churchmanagement.church.domain.repository.UserChurchScopeRepository;
import com.mikkytrionze.churchmanagement.member.domain.enums.Gender;
import com.mikkytrionze.churchmanagement.member.domain.model.Member;
import com.mikkytrionze.churchmanagement.member.domain.repository.MemberRepository;
import com.mikkytrionze.churchmanagement.member.domain.gateway.MemberEventPublisher;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
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
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ChurchManagementApplication.class, webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@AutoConfigureMockMvc
@Import({TestCacheConfig.class, ApiServicePerformanceBudgetTest.RedisStubConfig.class})
class ApiServicePerformanceBudgetTest {

    @TestConfiguration
    static class RedisStubConfig {
        @Bean @Primary RedisConnectionFactory redisConnectionFactory() { return mock(RedisConnectionFactory.class); }
        static final ConcurrentHashMap<String, String> store = new ConcurrentHashMap<>();
        @Bean @Primary StringRedisTemplate stringRedisTemplate() {
            StringRedisTemplate t = mock(StringRedisTemplate.class); ValueOperations<String,String> ops = mock(ValueOperations.class);
            when(t.opsForValue()).thenReturn(ops);
            when(ops.get(anyString())).thenAnswer(inv -> store.get(inv.getArgument(0)));
            doAnswer(inv -> { store.put(inv.getArgument(0), inv.getArgument(1)); return null; }).when(ops).set(anyString(), anyString());
            when(t.hasKey(anyString())).thenAnswer(inv -> store.containsKey(inv.getArgument(0)));
            when(t.delete(anyString())).thenAnswer(inv -> store.remove((String)inv.getArgument(0)) != null);
            return t;
        }
    }

    @Autowired MockMvc mockMvc; @Autowired JwtUtil jwtUtil; @Autowired ChurchRepository churchRepository;
    @Autowired MemberRepository memberRepository; @Autowired UserChurchScopeRepository scopeRepository; @Autowired EntityManagerFactory emf;
    @MockitoBean MemberEventPublisher memberEventPublisher;

    Church church; String token;
    record Report(double p50,double p95,long maxMs,double avgQueries,long maxQueries){}
    @FunctionalInterface interface ThrowingRunnable { void run() throws Exception; }

    @BeforeEach void setUp() {
        RedisStubConfig.store.clear(); scopeRepository.deleteAll(); memberRepository.deleteAll(); churchRepository.deleteAll();
        church = churchRepository.save(Church.builder().name("PERF").address("A").status("ACTIVE").churchType("PARENT").build());
        long uid = 500L;
        memberRepository.save(Member.builder().tel("user"+uid).firstName("F").lastName("L").gender(Gender.MALE).emailAddress("u"+uid+"@x.test").church(church).userId(uid).isBaptised(false).build());
        scopeRepository.save(UserChurchScope.builder().userId(uid).church(church).build());
        token = jwtUtil.generateToken("user"+uid, 3600_000L, "access", Map.of("uid",uid,"churchId",church.getId(),"perm_epoch",0L,"jti","jti-"+UUID.randomUUID(),"authorities",List.of("CHURCH:VIEW","CHURCH:READ","CHURCH:UPDATE","MEMBERS:VIEW","MEMBERS:READ")));
    }

    Statistics stats(){ return emf.unwrap(SessionFactory.class).getStatistics(); }
    double percentile(List<Long> sorted,int p){ double idx=(p/100.0)*(sorted.size()-1); int lo=(int)Math.floor(idx),hi=(int)Math.ceil(idx); return lo==hi?sorted.get(lo):sorted.get(lo)+(sorted.get(hi)-sorted.get(lo))*(idx-lo); }
    Report measure(int warmup,int samples,ThrowingRunnable action) throws Exception {
        for(int i=0;i<warmup;i++) action.run();
        List<Long> ms=new ArrayList<>(); List<Long> qs=new ArrayList<>();
        for(int i=0;i<samples;i++){ stats().clear(); long t0=System.nanoTime(); action.run(); ms.add((System.nanoTime()-t0)/1_000_000); qs.add(stats().getPrepareStatementCount()); }
        Collections.sort(ms); long maxMs=ms.get(ms.size()-1); double p50=percentile(ms,50), p95=percentile(ms,95); double avgQ=qs.stream().mapToLong(x->x).average().orElse(0); long maxQ=qs.stream().mapToLong(x->x).max().orElse(0);
        return new Report(p50,p95,maxMs,avgQ,maxQ);
    }

    @Test void governedRead_latencyAndQueryBudget() throws Exception {
        Report r = measure(1,20,() -> mockMvc.perform(get("/api/v1/churches/{id}", church.getId()).header("Authorization","Bearer "+token)).andExpect(status().isOk()));
        System.out.println("METRIC api.governedRead p50="+r.p50+"ms p95="+r.p95+"ms max="+r.maxMs+"ms avgQueries="+r.avgQueries+" maxQueries="+r.maxQueries);
        assertTrue(r.p95 <= 300, "p95 budget exceeded: "+r);
        assertTrue(r.maxQueries <= 20, "query budget exceeded: "+r);
    }

    @Test void governedMutation_latencyAndQueryBudget() throws Exception {
        Report r = measure(1,20,() -> {
            String name = "PERF-" + UUID.randomUUID();
            mockMvc.perform(put("/api/v1/churches/{id}", church.getId()).header("Authorization","Bearer "+token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\""+name+"\",\"address\":\"A\",\"status\":\"ACTIVE\"}"))
                    .andExpect(status().isOk());
        });
        System.out.println("METRIC api.governedMutation p50="+r.p50+"ms p95="+r.p95+"ms max="+r.maxMs+"ms avgQueries="+r.avgQueries+" maxQueries="+r.maxQueries);
        assertTrue(r.p95 <= 300, "p95 budget exceeded: "+r);
        assertTrue(r.maxQueries <= 25, "query budget exceeded: "+r);
    }
}
