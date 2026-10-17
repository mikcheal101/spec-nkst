package com.mikkytrionze.nkst.dashboard.api;

import com.mikkytrionze.nkst.dashboard.api.response.DashboardResponse;
import com.mikkytrionze.nkst.dashboard.domain.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/counters")
    public ResponseEntity<DashboardResponse> getCounters() {
        DashboardResponse response = dashboardService.getCounters();
        return ResponseEntity.ok().body(response);
    }
}
