package com.mikkytrionze.nkst.deacon.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mikkytrionze.nkst.deacon.api.request.MakeDeaconRequest;
import com.mikkytrionze.nkst.deacon.domain.service.DeaconService;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
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

class DeaconControllerTest {

    private MockMvc mockMvc;

    private final DeaconService deaconService = mock(DeaconService.class);

    private final ObjectMapper objectMapper =
            new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DeaconController(deaconService))
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver(),
                        new SortHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void shouldGetDeacons() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();
        Page<MemberResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1);

        when(deaconService.fetchDeacons(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/deacons")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void shouldGetDeaconById() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        when(deaconService.getDeacon(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/deacons/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldMakeDeacon() throws Exception {
        MakeDeaconRequest request = MakeDeaconRequest.builder().memberId(1L).build();

        when(deaconService.createDeacon(any(MakeDeaconRequest.class))).thenReturn(true);

        mockMvc.perform(post("/api/v1/deacons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().string("true"));
    }

    @Test
    void shouldSearchDeacons() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();
        Page<MemberResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1);

        when(deaconService.searchProspectiveDeacons(eq("John"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/deacons/search")
                        .param("query", "John"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void shouldUpdateDeacon() throws Exception {
        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .build();
        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .lastName("Doe")
                .firstName("Jane")
                .gender("FEMALE")
                .churchId(2L)
                .isBaptised(false)
                .build();

        when(deaconService.updateDeacon(eq(1L), any(UpdateMemberRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/deacons/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
}
