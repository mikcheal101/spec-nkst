package com.mikkytrionze.nkst.pastor.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mikkytrionze.nkst.TestCacheConfig;
import com.mikkytrionze.nkst.pastor.api.response.PastorRoleResponse;
import com.mikkytrionze.nkst.pastor.domain.service.PastorRoleService;
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
@WithMockUser(authorities = {"can_view_pastor", "can_read_pastor"})
class PastorRoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PastorRoleService pastorRoleService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldGetAllPastorRoles() throws Exception {
        PastorRoleResponse response = PastorRoleResponse.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();

        Page<PastorRoleResponse> page = new PageImpl<>(List.of(response));

        when(pastorRoleService.getPastorRoles(any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/pastor-roles")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Lead Pastor"));
    }

    @Test
    void shouldGetPastorRoleById() throws Exception {
        PastorRoleResponse response = PastorRoleResponse.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();

        when(pastorRoleService.getPastorRole(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/pastor-roles/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Lead Pastor"));
    }
}
