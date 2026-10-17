package com.mikkytrionze.nkst.dashboard.application.service;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.dashboard.api.response.DashboardResponse;
import org.junit.jupiter.api.Test;

class DashboardServiceImplTest {

    private final DashboardServiceImpl dashboardService = new DashboardServiceImpl();

    @Test
    void shouldReturnZeroCounters() {
        DashboardResponse response = dashboardService.getCounters();

        assertNotNull(response);
        assertEquals(0, response.getAnnouncements());
        assertEquals(0, response.getChurches());
        assertEquals(0L, response.getContributions());
        assertEquals(0, response.getMembers());
        assertEquals(0, response.getProjects());
    }
}
