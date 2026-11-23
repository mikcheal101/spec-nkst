package performance;

import com.mikkytrionze.announcement.AnnouncementApplication;
import com.mikkytrionze.announcement.domain.model.Announcement;
import com.mikkytrionze.announcement.domain.repository.AnnouncementRepository;
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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.mikkytrionze.announcement.domain.grpc.ChurchGrpcClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = AnnouncementApplication.class, webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@AutoConfigureMockMvc
@Import(AnnouncementPerformanceBudgetTest.RedisStubConfig.class)
class AnnouncementPerformanceBudgetTest {

    @TestConfiguration
    static class RedisStubConfig {
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

    @Autowired MockMvc mockMvc; @Autowired JwtUtil jwtUtil; @Autowired AnnouncementRepository repository; @Autowired EntityManagerFactory emf;
    @MockitoBean ChurchGrpcClient churchGrpcClient;

    record Report(double p50,double p95,long maxMs,double avgQueries,long maxQueries){}
    @FunctionalInterface interface ThrowingRunnable { void run() throws Exception; }

    String token;
    @BeforeEach void setUp() {
        RedisStubConfig.store.clear(); repository.deleteAll();
        for (int i=1;i<=5;i++) repository.save(Announcement.builder().churchId(1L).churchName("C1").title("T"+i).content("c").priority(com.mikkytrionze.announcement.domain.model.Priority.LOW).rolesAllowed(List.of("ROLE_MEMBER")).expiresAt(LocalDateTime.now().plusDays(1)).deleted(false).build());
        token = jwtUtil.generateToken("user1", 3600_000L, "access", Map.of("uid",1L,"churchId",1L,"perm_epoch",0L,"jti","jti-"+UUID.randomUUID(),"authorities",List.of("ANNOUNCEMENTS:VIEW","ANNOUNCEMENTS:READ","ROLE_SUPER_ADMIN")));
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

    @Test void announcementRead_latencyAndQueryBudget() throws Exception {
        Report r = measure(1,20,() -> mockMvc.perform(get("/api/v1/announcements").header("Authorization","Bearer "+token)).andExpect(status().isOk()));
        System.out.println("METRIC announcement.read p50="+r.p50+"ms p95="+r.p95+"ms max="+r.maxMs+"ms avgQueries="+r.avgQueries+" maxQueries="+r.maxQueries);
        assertTrue(r.p95 <= 300, "p95 budget exceeded: "+r);
        assertTrue(r.maxQueries <= 15, "query budget exceeded: "+r);
    }
}
