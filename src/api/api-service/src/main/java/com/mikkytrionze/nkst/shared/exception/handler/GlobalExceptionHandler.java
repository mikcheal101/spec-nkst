package com.mikkytrionze.nkst.shared.exception.handler;

import com.mikkytrionze.nkst.shared.dto.response.ErrorResponse;
import com.mikkytrionze.nkst.shared.exception.BadRequestException;
import com.mikkytrionze.nkst.shared.exception.KafkaMessagingException;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DataIntegrityViolationException exception) {
        log.error("Database conflict: {}", exception.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("CONFLICT: A record with these details already exist!.")
                .status(HttpStatus.CONFLICT.value())
                .timestamp(Instant.now())
                .build();

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(ResourceNotFoundException resourceNotFoundException) {
        log.warn("Resource not found: {}", resourceNotFoundException.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(resourceNotFoundException.getMessage())
                .status(HttpStatus.NOT_FOUND.value())
                .timestamp(Instant.now())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadException(BadRequestException badRequestException) {
        log.warn("Bad request encountered: {}", badRequestException.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(badRequestException.getMessage())
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(Instant.now())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(KafkaMessagingException.class)
    public ResponseEntity<ErrorResponse> handleKafkaMessagingException(KafkaMessagingException exception) {
        log.error("Kafka messaging failure: {}", exception.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(exception.getMessage())
                .status(HttpStatus.SERVICE_UNAVAILABLE.value())
                .timestamp(Instant.now())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        log.warn("Validation error: {}", message);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(Instant.now())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        log.warn("Illegal argument: {}", exception.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(exception.getMessage())
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(Instant.now())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception exception) {
        log.error("Unhandled exception: {}", exception.getMessage(), exception);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("An unexpected error occurred. Please try again later.")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .timestamp(Instant.now())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
