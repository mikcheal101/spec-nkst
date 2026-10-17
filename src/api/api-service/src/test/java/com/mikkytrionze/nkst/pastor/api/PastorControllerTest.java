package com.mikkytrionze.nkst.pastor.api;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mikkytrionze.nkst.TestCacheConfig;
import com.mikkytrionze.nkst.pastor.api.request.PastorRequest;
import com.mikkytrionze.nkst.pastor.api.response.PastorResponse;
import com.mikkytrionze.nkst.pastor.domain.service.PastorService;
import java.time.Instant;
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
@WithMockUser(authorities = {"can_view_pastor", "can_read_pastor", "can_create_pastor", "can_update_pastor", "can_delete_pastor"})
class PastorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PastorService pastorService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void shouldGetAllPastors() throws Exception {
        PastorResponse response = PastorResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        Page<PastorResponse> page = new PageImpl<>(List.of(response));

        when(pastorService.getPastors(any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/pastors")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].firstName").value("John"));
    }

    @Test
    void shouldCreatePastor() throws Exception {
        PastorRequest request = PastorRequest.builder()
                .churchId(1L)
                .pastorRoleId(1L)
                .memberId(1L)
                .build();

        PastorResponse response = PastorResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        when(pastorService.createPastor(any(PastorRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/pastors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("John"));
    }

    @Test
    void shouldGetPastorById() throws Exception {
        PastorResponse response = PastorResponse.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        when(pastorService.getPastorById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/pastors/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("John"));
    }

    @Test
    void shouldUpdatePastor() throws Exception {
        PastorRequest request = PastorRequest.builder()
                .churchId(1L)
                .pastorRoleId(1L)
                .memberId(2L)
                .build();

        PastorResponse response = PastorResponse.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Smith")
                .build();

        when(pastorService.updatePastor(eq(1L), any(PastorRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/pastors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"));
    }

    @Test
    void shouldDeletePastor() throws Exception {
        doNothing().when(pastorService).deletePastorById(1L);

        mockMvc.perform(delete("/api/v1/pastors/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}
