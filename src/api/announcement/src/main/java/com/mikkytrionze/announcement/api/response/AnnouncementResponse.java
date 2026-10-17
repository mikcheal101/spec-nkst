package com.mikkytrionze.announcement.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String content;
    private String priority;
    private LocalDateTime expiresAt;
}
