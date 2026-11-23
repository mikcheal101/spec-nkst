package com.mikkytrionze.churchmanagement.integration;

import com.mikkytrionze.churchmanagement.TestCacheConfig;
import com.mikkytrionze.churchmanagement.church.domain.model.Church;
import com.mikkytrionze.churchmanagement.church.domain.model.UserChurchScope;
import com.mikkytrionze.churchmanagement.church.domain.repository.ChurchRepository;
import com.mikkytrionze.churchmanagement.church.domain.repository.UserChurchScopeRepository;
import com.mikkytrionze.churchmanagement.member.domain.enums.Gender;
import com.mikkytrionze.churchmanagement.member.domain.model.Member;
import com.mikkytrionze.churchmanagement.member.domain.repository.MemberRepository;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.mikkytrionze.churchmanagement.member.domain.gateway.MemberEventPublisher;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@AutoConfigureMockMvc
@Import({TestCacheConfig.class, GovernanceScopeLifecycleIntegrationTest.RedisStubConfig.class})
class GovernanceScopeLifecycleIntegrationTest {

    @TestConfiguration
    static class RedisStubConfig {
        @Bean @Primary RedisConnectionFactory redisConnectionFactory() { return mock(RedisConnectionFactory.class); }
        static final ConcurrentHashMap<String, String> store = new ConcurrentHashMap<>();
        @Bean @Primary
        StringRedisTemplate stringRedisTemplate() {
            StringRedisTemplate t = mock(StringRedisTemplate.class);
            ValueOperations<String, String> ops = mock(ValueOperations.class);
            when(t.opsForValue()).thenReturn(ops);
            when(ops.get(anyString())).thenAnswer(inv -> store.get(inv.getArgument(0)));
            doAnswer(inv -> { store.put(inv.getArgument(0), inv.getArgument(1)); return null; }).when(ops).set(anyString(), anyString());
            when(t.hasKey(anyString())).thenAnswer(inv -> store.containsKey(inv.getArgument(0)));
            when(t.delete(anyString())).thenAnswer(inv -> store.remove((String)inv.getArgument(0)) != null);
            return t;
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwtUtil;
    @Autowired ChurchRepository churchRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired UserChurchScopeRepository scopeRepository;
    @MockitoBean MemberEventPublisher memberEventPublisher;

    Church parent; Church sub; Church other;

    @BeforeEach
    void setUp() {
        RedisStubConfig.store.clear();
        scopeRepository.deleteAll();
        memberRepository.deleteAll();
        churchRepository.deleteAll();
        parent = churchRepository.save(Church.builder().name("PARENT").address("A").status("ACTIVE").churchType("PARENT").build());
        sub = churchRepository.save(Church.builder().name("SUB").address("B").status("ACTIVE").churchType("SUB_CHURCH").parentChurch(parent).build());
        other = churchRepository.save(Church.builder().name("OTHER").address("C").status("ACTIVE").churchType("PARENT").build());
    }

    String token(long uid, long churchId, String... auths) {
        String jti = "jti-" + UUID.randomUUID();
        return jwtUtil.generateToken("user" + uid, 3600_000L, "access", Map.of("uid", uid, "churchId", churchId, "perm_epoch", 0L, "jti", jti, "authorities", List.of(auths)));
    }
    Member member(long userId, Church church) {
        String uname = "user" + userId;
        return memberRepository.save(Member.builder().tel(uname).firstName("F").lastName("L").gender(Gender.MALE).emailAddress(uname+"@x.test").church(church).userId(userId).isBaptised(false).build());
    }

    @Test
    void explicitSubChurchScope_allowsScopedAndDeniesOutOfScope_noInheritance() throws Exception {
        long uid = 100L;
        member(uid, parent);
        scopeRepository.save(UserChurchScope.builder().userId(uid).church(sub).build());
        String tok = token(uid, parent.getId(), "CHURCH:VIEW", "CHURCH:READ", "MEMBERS:VIEW", "MEMBERS:READ");

        mockMvc.perform(get("/api/v1/churches/{id}", sub.getId()).header("Authorization", "Bearer " + tok)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/churches/{id}", parent.getId()).header("Authorization", "Bearer " + tok)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/churches/{id}", other.getId()).header("Authorization", "Bearer " + tok)).andExpect(status().isForbidden());
    }

    @Test
    void churchLifecycleTransition_invalidRejected_validCascades() throws Exception {
        long uid = 101L;
        member(uid, parent);
        scopeRepository.save(UserChurchScope.builder().userId(uid).church(parent).build());
        String tok = token(uid, parent.getId(), "CHURCH:UPDATE", "CHURCH:READ");

        parent.setStatus("ARCHIVED"); churchRepository.save(parent);
        mockMvc.perform(put("/api/v1/churches/{id}", parent.getId()).header("Authorization", "Bearer " + tok)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"PARENT\",\"address\":\"A\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isBadRequest());

        parent.setStatus("ACTIVE"); churchRepository.save(parent);
        sub.setStatus("ACTIVE"); churchRepository.save(sub);
        mockMvc.perform(put("/api/v1/churches/{id}", parent.getId()).header("Authorization", "Bearer " + tok)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"PARENT\",\"address\":\"A\",\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isOk());

        assertEquals("SUSPENDED", churchRepository.findById(sub.getId()).orElseThrow().getStatus());
    }

    @Test
    void memberBaptisedNonBaptisedTransitions_enforced() throws Exception {
        long uid = 102L;
        member(uid, parent);
        scopeRepository.save(UserChurchScope.builder().userId(uid).church(parent).build());
        String tok = token(uid, parent.getId(), "MEMBERS:CREATE", "MEMBERS:UPDATE", "MEMBERS:READ");

        String createBody = "{\"tel\":\"0809990001\",\"lastName\":\"Doe\",\"firstName\":\"Jane\",\"gender\":\"FEMALE\",\"emailAddress\":\"jane@x.test\",\"churchId\":"+parent.getId()+",\"isBaptised\":false}";
        String created = mockMvc.perform(post("/api/v1/members").header("Authorization", "Bearer " + tok)
                        .contentType(MediaType.APPLICATION_JSON).content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int idIdx = created.indexOf("\"id\":") + 5;
        long memberId = Long.parseLong(created.substring(idIdx, created.indexOf(',', idIdx)));

        mockMvc.perform(put("/api/v1/members/{id}", memberId).header("Authorization", "Bearer " + tok)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lastName\":\"Doe\",\"firstName\":\"Jane\",\"gender\":\"FEMALE\",\"churchId\":"+parent.getId()+",\"isBaptised\":true}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/v1/members/{id}", memberId).header("Authorization", "Bearer " + tok)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lastName\":\"Doe\",\"firstName\":\"Jane\",\"gender\":\"FEMALE\",\"churchId\":"+parent.getId()+",\"isBaptised\":true,\"dateOfBaptism\":\"2024-01-01\",\"serialNumber\":1234,\"worshipCenter\":\"Main\",\"bibleVerse\":\"John 3:16\",\"baptisedBy\":\"Pastor\",\"address\":\"Addr\"}"))
                .andExpect(status().isOk());
    }
}
