package com.mikkytrionze.churchmanagement.shared.exception.handler;

import com.mikkytrionze.churchmanagement.shared.dto.response.ErrorResponse;
import com.mikkytrionze.churchmanagement.shared.exception.BadRequestException;
import com.mikkytrionze.churchmanagement.shared.exception.KafkaMessagingException;
import com.mikkytrionze.churchmanagement.shared.exception.ProfileContactConflictException;
import com.mikkytrionze.churchmanagement.shared.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DataIntegrityViolationException exception, HttpServletRequest request) {
        log.warn("Database conflict: {}", exception.getMostSpecificCause() != null ? exception.getMostSpecificCause().getMessage() : exception.getMessage());
        return build(HttpStatus.CONFLICT, "CONFLICT", "A record with these details already exists.", request, null);
    }

    @ExceptionHandler(ProfileContactConflictException.class)
    public ResponseEntity<ErrorResponse> handleProfileContactConflict(ProfileContactConflictException ex, HttpServletRequest request) {
        log.warn("Profile contact conflict: {}", ex.getMessage());
        return build(HttpStatus.CONFLICT, "PROFILE_CONTACT_CONFLICT", "Unable to update profile with the provided information.", request, null);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return build(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request, null);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadException(BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request, null);
    }

    @ExceptionHandler(KafkaMessagingException.class)
    public ResponseEntity<ErrorResponse> handleKafkaMessagingException(KafkaMessagingException ex, HttpServletRequest request) {
        log.error("Kafka messaging failure: {}", ex.getMessage());
        return build(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("fieldErrors", ex.getBindingResult().getFieldErrors().stream()
                .map(error -> Map.of("field", error.getField(), "message", String.valueOf(error.getDefaultMessage())))
                .collect(Collectors.toList()));
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", request, details);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "AUTHZ_FORBIDDEN", "Access denied", request, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required", request, null);
    }

    @ExceptionHandler(com.mikkytrionze.churchmanagement.shared.exception.RateLimitException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(com.mikkytrionze.churchmanagement.shared.exception.RateLimitException ex, HttpServletRequest request) {
        return build(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", ex.getMessage(), request, Map.of("retryAfterSeconds", ex.getRetryAfterSeconds()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.", request, null);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message, HttpServletRequest request, Map<String, Object> details) {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) correlationId = MDC.get("correlationId");
        if (correlationId == null || correlationId.isBlank()) correlationId = UUID.randomUUID().toString();
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .code(code)
                .message(message)
                .path(request.getRequestURI())
                .correlationId(correlationId)
                .details(details == null || details.isEmpty() ? null : details)
                .build();
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status).header("X-Correlation-ID", correlationId);
        if (status == HttpStatus.TOO_MANY_REQUESTS && details != null && details.get("retryAfterSeconds") instanceof Number n) {
            builder.header("Retry-After", String.valueOf(n.intValue()));
        }
        return builder.body(body);
    }
}
