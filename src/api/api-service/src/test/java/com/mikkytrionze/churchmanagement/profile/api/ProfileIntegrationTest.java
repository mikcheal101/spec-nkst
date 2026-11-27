package com.mikkytrionze.churchmanagement.profile.api;

import com.mikkytrionze.churchmanagement.TestCacheConfig;
import com.mikkytrionze.churchmanagement.church.domain.model.Church;
import com.mikkytrionze.churchmanagement.church.domain.repository.ChurchRepository;
import com.mikkytrionze.churchmanagement.member.domain.enums.Gender;
import com.mikkytrionze.churchmanagement.member.domain.model.Member;
import com.mikkytrionze.churchmanagement.member.domain.repository.MemberRepository;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@AutoConfigureMockMvc
@Import(TestCacheConfig.class)
class ProfileIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwtUtil;
    @Autowired MemberRepository memberRepository;
    @Autowired ChurchRepository churchRepository;

    Church church;
    Member member;

    @BeforeEach
    void setUp() {
        memberRepository.deleteAll();
        churchRepository.deleteAll();
        church = churchRepository.save(Church.builder().name("C1").address("A").status("ACTIVE").churchType("PARENT").build());
        member = memberRepository.save(Member.builder()
                .id(null).tel("1234567890").firstName("John").lastName("Doe").middleName("M")
                .emailAddress("john@test.com").gender(Gender.MALE).church(church).userId(100L).build());
    }

    String token(Member m) {
        String jti = "jti-" + UUID.randomUUID();
        // SecurityUtils resolves current user by identifier (tel/email) from Authentication.getName().
        return jwtUtil.generateToken(m.getTel(), 3600_000L, "access",
                Map.of("uid", m.getUserId(), "churchId", church.getId(), "perm_epoch", 0L, "jti", jti,
                        "authorities", List.of("PROFILE:READ", "PROFILE:UPDATE")));
    }

    @Test
    void getProfile_returnsCurrentUserProfile() throws Exception {
        mockMvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + token(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.email").value("john@test.com"))
                .andExpect(jsonPath("$.phoneNumber").value("1234567890"))
                .andExpect(jsonPath("$.username").value("1234567890"));
    }

    @Test
    void updateProfile_persistsPartialSafeAndReturnsLatest() throws Exception {
        String body = "{\"firstName\":\"Jane\",\"lastName\":\"Doe\",\"tel\":\"1234567890\",\"emailAddress\":\"john@test.com\"}";
        mockMvc.perform(post("/api/v1/profile").header("Authorization", "Bearer " + token(member))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.middleName").value("M"))
                .andExpect(jsonPath("$.email").value("john@test.com"));

        Member reloaded = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(reloaded.getFirstName()).isEqualTo("Jane");
        assertThat(reloaded.getMiddleName()).isEqualTo("M"); // no clobber
    }

    @Test
    void updateProfile_duplicateContact_returnsGeneric409NoPersistence() throws Exception {
        memberRepository.save(Member.builder().tel("9999999999").firstName("Other").lastName("User")
                .emailAddress("other@test.com").gender(Gender.MALE).church(church).userId(101L).build());

        String body = "{\"firstName\":\"Jane\",\"lastName\":\"Doe\",\"tel\":\"9999999999\",\"emailAddress\":\"john@test.com\"}";
        mockMvc.perform(post("/api/v1/profile").header("Authorization", "Bearer " + token(member))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROFILE_CONTACT_CONFLICT"))
                .andExpect(jsonPath("$.message").value("Unable to update profile with the provided information."))
                .andExpect(jsonPath("$.details").doesNotExist());

        Member reloaded = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(reloaded.getTel()).isEqualTo("1234567890");
    }

    @Test
    void updateProfile_invalidPhone_returns400() throws Exception {
        String body = "{\"firstName\":\"Jane\",\"lastName\":\"Doe\",\"tel\":\"12\",\"emailAddress\":\"john@test.com\"}";
        mockMvc.perform(post("/api/v1/profile").header("Authorization", "Bearer " + token(member))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void updateProfile_lastSaveWinsSequentialRequests() throws Exception {
        String body1 = "{\"firstName\":\"Jane\",\"lastName\":\"Doe\",\"tel\":\"1234567890\",\"emailAddress\":\"jane1@test.com\"}";
        String body2 = "{\"firstName\":\"Janet\",\"lastName\":\"Doe\",\"tel\":\"1234567890\",\"emailAddress\":\"jane2@test.com\"}";

        mockMvc.perform(post("/api/v1/profile").header("Authorization", "Bearer " + token(member))
                        .contentType(MediaType.APPLICATION_JSON).content(body1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"));

        mockMvc.perform(post("/api/v1/profile").header("Authorization", "Bearer " + token(member))
                        .contentType(MediaType.APPLICATION_JSON).content(body2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Janet"))
                .andExpect(jsonPath("$.email").value("jane2@test.com"));

        Member reloaded = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(reloaded.getFirstName()).isEqualTo("Janet");
        assertThat(reloaded.getEmailAddress()).isEqualTo("jane2@test.com");
    }
}
