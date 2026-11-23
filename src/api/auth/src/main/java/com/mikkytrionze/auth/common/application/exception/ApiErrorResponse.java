package com.mikkytrionze.auth.common.application.exception;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        String correlationId,
        Map<String, Object> details
) {
    public static ApiErrorResponse of(int status, String error, String code, String message, String path, String correlationId, Map<String, Object> details) {
        return new ApiErrorResponse(Instant.now(), status, error, code, message, path, correlationId, details == null || details.isEmpty() ? null : details);
    }
}
