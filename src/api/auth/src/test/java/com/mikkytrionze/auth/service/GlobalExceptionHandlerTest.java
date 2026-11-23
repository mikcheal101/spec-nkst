package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.exception.ApiErrorResponse;
import com.mikkytrionze.auth.common.application.exception.GlobalExceptionHandler;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @InjectMocks
    private GlobalExceptionHandler globalExceptionHandler;

    @Test
    void handleValidation_withFieldErrors_returnsStandardBadRequest() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "username", "Username is required");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/auth/sign-in");
        when(request.getHeader("X-Correlation-ID")).thenReturn("corr-1");

        var response = globalExceptionHandler.handleValidation(ex, request);

        assertEquals(400, response.getStatusCode().value());
        ApiErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals("VALIDATION_ERROR", body.code());
        assertEquals("/api/v1/auth/sign-in", body.path());
        assertEquals("corr-1", body.correlationId());
        assertNotNull(body.details());
        assertTrue(body.details().containsKey("fieldErrors"));
    }

    @Test
    void handleValidation_withGlobalErrors_returnsBadRequest() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "password", "Passwords do not match");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/auth/sign-up");
        when(request.getHeader("X-Correlation-ID")).thenReturn(null);

        var response = globalExceptionHandler.handleValidation(ex, request);

        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("VALIDATION_ERROR", response.getBody().code());
        assertNotNull(response.getBody().correlationId());
    }

    @Test
    void handleValidation_withMultipleFieldErrors_returnsAll() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError error1 = new FieldError("object", "username", "Username is required");
        FieldError error2 = new FieldError("object", "password", "Password is required");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(error1, error2));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/auth/sign-in");

        var response = globalExceptionHandler.handleValidation(ex, request);

        assertEquals(400, response.getStatusCode().value());
        ApiErrorResponse body = response.getBody();
        assertNotNull(body);
        @SuppressWarnings("unchecked")
        List<Map<String, String>> errors = (List<Map<String, String>>) body.details().get("fieldErrors");
        assertEquals(2, errors.size());
    }
}
