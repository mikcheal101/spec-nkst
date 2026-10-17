package com.mikkytrionze.auth.common.application.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .collect(Collectors.joining(", "));

        String globalMessage = ex.getBindingResult().getGlobalErrors().stream()
                .map(objectError -> objectError.getDefaultMessage())
                .collect(Collectors.joining(", "));

        String message = globalMessage.isEmpty() ? errorMessage : globalMessage;
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }
}
