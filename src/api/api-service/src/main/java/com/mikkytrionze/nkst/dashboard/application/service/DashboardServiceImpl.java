package com.mikkytrionze.nkst.dashboard.application.service;

import com.mikkytrionze.nkst.dashboard.api.response.DashboardResponse;
import com.mikkytrionze.nkst.dashboard.domain.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DashboardServiceImpl implements DashboardService {

    @Override
    public DashboardResponse getCounters() {
        return DashboardResponse.builder()
                .announcements(0)
                .churches(0)
                .contributions(0L)
                .members(0)
                .projects(0)
                .build();
    }
}
