package com.mikkytrionze.nkst.church.api;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mikkytrionze.nkst.TestCacheConfig;
import com.mikkytrionze.nkst.church.api.request.ChurchRequest;
import com.mikkytrionze.nkst.church.api.response.ChurchResponse;
import com.mikkytrionze.nkst.church.domain.service.ChurchService;
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
@WithMockUser(authorities = {"can_view_church", "can_create_church", "can_update_church", "can_read_church", "can_delete_church"})
class ChurchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChurchService churchService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldGetAllChurches() throws Exception {
        ChurchResponse response = ChurchResponse.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .build();

        Page<ChurchResponse> page = new PageImpl<>(List.of(response));

        when(churchService.getChurches(any(PageRequest.class))).thenReturn(page);

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
        doNothing().when(churchService).deleteChurch(1L);

        mockMvc.perform(delete("/api/v1/churches/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldGetSubChurches() throws Exception {
        PageRequest pageRequest = PageRequest.of(0, 20);

        ChurchResponse churchResponse = ChurchResponse.builder()
                .id(1L)
                .name("Church I")
                .address("Church address")
                .emailAddress("church@mail.com")
                .build();

        Page<ChurchResponse> page = new PageImpl<>(List.of(churchResponse));

        when(churchService.getSubChurches(1L, pageRequest)).thenReturn(page);

        mockMvc.perform(get("/api/v1/churches/sub-churches/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Church I"));
    }
}
