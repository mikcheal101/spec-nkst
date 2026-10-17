package com.mikkytrionze.announcement.api.request;

import com.mikkytrionze.announcement.domain.model.Priority;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class CreateAnnouncementRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @NotEmpty(message = "At least one role must be allowed")
    private List<String> rolesAllowed;

    @NotNull(message = "Expiration date is required")
    @FutureOrPresent(message = "Expiration date must be in the future")
    private LocalDateTime expiresAt;
}
