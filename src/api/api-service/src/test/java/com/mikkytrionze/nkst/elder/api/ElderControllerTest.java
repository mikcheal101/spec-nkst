package com.mikkytrionze.nkst.elder.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mikkytrionze.nkst.elder.api.request.MakeElderRequest;
import com.mikkytrionze.nkst.elder.domain.service.ElderService;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.data.web.SortHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ElderControllerTest {

    private MockMvc mockMvc;

    private final ElderService elderService = mock(ElderService.class);

    private final ObjectMapper objectMapper =
            new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ElderController(elderService))
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver(),
                        new SortHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void shouldGetElders() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();
        Page<MemberResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1);

        when(elderService.getElders(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/elders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void shouldGetElderById() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        when(elderService.getElder(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/elders/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldMakeElder() throws Exception {
        MakeElderRequest request = MakeElderRequest.builder().memberId(1L).build();

        when(elderService.makeElder(any(MakeElderRequest.class))).thenReturn(true);

        mockMvc.perform(post("/api/v1/elders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().string("true"));
    }

    @Test
    void shouldSearchEligibleMembers() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();
        Page<MemberResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1);

        when(elderService.searchEligibleMembersForElder(eq("John"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/elders/search")
                        .param("query", "John"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }
}
