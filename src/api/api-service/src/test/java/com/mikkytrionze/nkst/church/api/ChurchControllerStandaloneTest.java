package com.mikkytrionze.nkst.church.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mikkytrionze.nkst.church.api.request.ChurchRequest;
import com.mikkytrionze.nkst.church.api.response.ChurchResponse;
import com.mikkytrionze.nkst.church.domain.service.ChurchService;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.domain.service.MemberService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ChurchControllerStandaloneTest {

    private MockMvc mockMvc;

    private final ChurchService churchService = mock(ChurchService.class);

    private final MemberService memberService = mock(MemberService.class);

    private final ChurchController churchController = new ChurchController(churchService, memberService);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(churchController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void shouldGetAllChurches() throws Exception {
        ChurchResponse response = ChurchResponse.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .build();

        Page<ChurchResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1);

        when(churchService.getChurches(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/churches")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Main Church"));
    }

    @Test
    void shouldCreateChurch() throws Exception {
        ChurchRequest request = ChurchRequest.builder()
                .name("New Church")
                .address("456 Oak St")
                .build();

        ChurchResponse response = ChurchResponse.builder()
                .id(1L)
                .name("New Church")
                .address("456 Oak St")
                .build();

        when(churchService.createChurch(any(ChurchRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/churches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("New Church"));
    }

    @Test
    void shouldGetChurchById() throws Exception {
        ChurchResponse response = ChurchResponse.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .build();

        when(churchService.getChurch(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/churches/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Main Church"));
    }

    @Test
    void shouldUpdateChurch() throws Exception {
        ChurchRequest request = ChurchRequest.builder()
                .name("Updated Church")
                .address("321 New St")
                .build();

        ChurchResponse response = ChurchResponse.builder()
                .id(1L)
                .name("Updated Church")
                .address("321 New St")
                .build();

        when(churchService.updateChurch(eq(1L), any(ChurchRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/churches/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Church"));
    }

    @Test
    void shouldDeleteChurch() throws Exception {
        mockMvc.perform(delete("/api/v1/churches/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldGetSubChurches() throws Exception {
        ChurchResponse response = ChurchResponse.builder()
                .id(1L)
                .name("Church I")
                .address("Church address")
                .build();

        Page<ChurchResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1);

        when(churchService.getSubChurches(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/churches/sub-churches/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Church I"));
    }

    @Test
    void shouldFetchChurchAdmins() throws Exception {
        MemberResponse member = MemberResponse.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Smith")
                .build();

        Page<MemberResponse> page = new PageImpl<>(List.of(member), PageRequest.of(0, 20), 1);

        when(memberService.fetchProspectiveAdmins(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/churches/church-admins/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].firstName").value("Jane"));
    }
}
