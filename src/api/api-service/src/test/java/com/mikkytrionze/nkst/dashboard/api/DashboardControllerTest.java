package com.mikkytrionze.nkst.dashboard.api;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.mikkytrionze.nkst.TestCacheConfig;
import com.mikkytrionze.nkst.dashboard.api.response.DashboardResponse;
import com.mikkytrionze.nkst.dashboard.domain.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Import(TestCacheConfig.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardService dashboardService;

    @Test
    void shouldGetCounters() throws Exception {
        DashboardResponse response = DashboardResponse.builder()
                .churches(5)
                .members(100)
                .contributions(50000L)
                .projects(3)
                .announcements(2)
                .build();

        when(dashboardService.getCounters()).thenReturn(response);

        mockMvc.perform(get("/api/v1/dashboard/counters")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.churches").value(5))
                .andExpect(jsonPath("$.members").value(100))
                .andExpect(jsonPath("$.contributions").value(50000))
                .andExpect(jsonPath("$.projects").value(3))
                .andExpect(jsonPath("$.announcements").value(2));
    }
}
