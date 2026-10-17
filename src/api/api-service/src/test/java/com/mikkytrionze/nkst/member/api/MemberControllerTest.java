package com.mikkytrionze.nkst.member.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mikkytrionze.nkst.TestCacheConfig;
import com.mikkytrionze.nkst.member.api.request.MemberRequest;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.domain.service.MemberService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Import(TestCacheConfig.class)
@WithMockUser(authorities = {"can_read_members", "can_view_members", "can_create_members", "can_update_members", "can_delete_members"})
class MemberControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MemberService memberService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void shouldGetAllMembers() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .tel("1234567890")
                .build();

        Page<MemberResponse> page = new PageImpl<>(List.of(response));

        when(memberService.getAllMembers(any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/members")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].firstName").value("John"));
    }

    @Test
    void shouldGetMemberById() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        when(memberService.getById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/members/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("John"));
    }

    @Test
    void shouldGetAllChurchMembers() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        Page<MemberResponse> page = new PageImpl<>(List.of(response));

        when(memberService.getAllChurchMembers(eq(1L), any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/members/church-members/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].firstName").value("John"));
    }

    @Test
    void shouldGetChurchMember() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(2L)
                .firstName("Jane")
                .lastName("Smith")
                .build();

        when(memberService.getChurchMember(1L, 2L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/members/church-members/1/2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.firstName").value("Jane"));
    }

    @Test
    void shouldCreateMember() throws Exception {
        MemberRequest request = MemberRequest.builder()
                .firstName("John").lastName("Doe")
                .tel("1234567890").gender("MALE")
                .isBaptised(false).emailAddress("john@example.com")
                .churchId(1L)
                .build();

        MemberResponse response = MemberResponse.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890")
                .build();

        when(memberService.saveMember(any(MemberRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldUpdateMember() throws Exception {
        MemberRequest request = MemberRequest.builder()
                .firstName("John").lastName("Doe")
                .tel("1234567890").gender("MALE")
                .isBaptised(false).emailAddress("john@example.com")
                .churchId(1L)
                .build();

        MemberResponse response = MemberResponse.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890")
                .build();

        when(memberService.updateMember(eq(1L), any(UpdateMemberRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/members/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldDeleteMember() throws Exception {
        doNothing().when(memberService).deleteMember(1L);

        mockMvc.perform(delete("/api/v1/members/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldSearchMembers() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        Page<MemberResponse> page = new PageImpl<>(List.of(response));

        when(memberService.searchMembers(eq("John"), any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/members/search")
                        .param("query", "John")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].firstName").value("John"));
    }
}
