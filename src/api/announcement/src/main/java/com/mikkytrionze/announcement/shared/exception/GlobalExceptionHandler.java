package com.mikkytrionze.announcement.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("fieldErrors", ex.getBindingResult().getFieldErrors().stream()
                .map(e -> Map.of("field", e.getField(), "message", String.valueOf(e.getDefaultMessage())))
                .collect(Collectors.toList()));
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", request, details);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleStatus(ResponseStatusException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String code = status == HttpStatus.UNAUTHORIZED ? "AUTH_UNAUTHORIZED" : status == HttpStatus.FORBIDDEN ? "AUTHZ_FORBIDDEN" : status.name();
        String msg = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        return build(status, code, msg, request, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request, null);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleDenied(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "AUTHZ_FORBIDDEN", "Access denied", request, null);
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuth(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", request, null);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message, HttpServletRequest request, Map<String, Object> details) {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) correlationId = MDC.get("correlationId");
        if (correlationId == null || correlationId.isBlank()) correlationId = UUID.randomUUID().toString();
        ErrorResponse body = new ErrorResponse(Instant.now(), status.value(), status.getReasonPhrase(), code, message, request.getRequestURI(), correlationId, details == null || details.isEmpty() ? null : details);
        ResponseEntity.BodyBuilder b = ResponseEntity.status(status).header("X-Correlation-ID", correlationId);
        if (status == HttpStatus.TOO_MANY_REQUESTS && details != null && details.get("retryAfterSeconds") instanceof Number n) b.header("Retry-After", String.valueOf(n.intValue()));
        return b.body(body);
    }
}
