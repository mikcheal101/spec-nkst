package com.mikkytrionze.nkst.churchAdmin.api;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.mikkytrionze.nkst.churchAdmin.domain.service.ChurchAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ChurchAdminControllerTest {

    private MockMvc mockMvc;

    private final ChurchAdminService churchAdminService = mock(ChurchAdminService.class);

    private final ChurchAdminController churchAdminController = new ChurchAdminController(churchAdminService);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(churchAdminController).build();
    }

    @Test
    void shouldMakeChurchAdmin() throws Exception {
        when(churchAdminService.setChurchAdmin(1L)).thenReturn(true);

        mockMvc.perform(put("/api/v1/church-admin/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(true));

        verify(churchAdminService).setChurchAdmin(1L);
    }

    @Test
    void shouldReturnTrueWhenChurchHasAdmin() throws Exception {
        when(churchAdminService.churchHasAdmin(1L)).thenReturn(true);

        mockMvc.perform(get("/api/v1/church-admin/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(true));

        verify(churchAdminService).churchHasAdmin(1L);
    }

    @Test
    void shouldReturnFalseWhenChurchHasNoAdmin() throws Exception {
        when(churchAdminService.churchHasAdmin(1L)).thenReturn(false);

        mockMvc.perform(get("/api/v1/church-admin/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(false));

        verify(churchAdminService).churchHasAdmin(1L);
    }
}
