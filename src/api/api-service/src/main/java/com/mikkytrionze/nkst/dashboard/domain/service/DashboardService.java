package com.mikkytrionze.nkst.dashboard.domain.service;

import com.mikkytrionze.nkst.dashboard.api.response.DashboardResponse;

/**
 * Service interface for dashboard data aggregation and analytics.
 * Provides high-level statistical summaries for the system overview.
 */
public interface DashboardService {

    /**
     * Aggregates and retrieves statistical counters for the main dashboard.
     *
     * @return A {@link DashboardResponse} containing the summary of system metrics
     * (e.g., total churches, active pastors, and other relevant entities).
     */
    DashboardResponse getCounters();
}