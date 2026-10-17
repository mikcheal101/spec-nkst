package com.mikkytrionze.nkst.dashboard.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class DashboardResponse {
    private String dailyMessage;

    @Builder.Default
    private Integer members = 0;

    @Builder.Default
    private Long contributions = 0L;

    @Builder.Default
    private Integer churches = 0;

    @Builder.Default
    private Integer projects = 0;

    @Builder.Default
    private Integer announcements = 0;
}
