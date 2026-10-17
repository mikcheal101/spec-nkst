package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @InjectMocks
    private GlobalExceptionHandler globalExceptionHandler;

    @Test
    void handleValidationExceptions_withFieldErrors_returnsBadRequest() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "username", "Username is required");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));
        when(bindingResult.getGlobalErrors()).thenReturn(List.of());

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        var response = globalExceptionHandler.handleValidationExceptions(ex);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().contains("username: Username is required"));
    }

    @Test
    void handleValidationExceptions_withGlobalErrors_returnsBadRequest() {
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of());

        org.springframework.validation.ObjectError globalError =
                new org.springframework.validation.ObjectError("object", "Passwords do not match!");
        when(bindingResult.getGlobalErrors()).thenReturn(List.of(globalError));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        var response = globalExceptionHandler.handleValidationExceptions(ex);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Passwords do not match!", response.getBody());
    }

    @Test
    void handleValidationExceptions_withMultipleFieldErrors_returnsAll() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError error1 = new FieldError("object", "username", "Username is required");
        FieldError error2 = new FieldError("object", "password", "Password is required");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(error1, error2));
        when(bindingResult.getGlobalErrors()).thenReturn(List.of());

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        var response = globalExceptionHandler.handleValidationExceptions(ex);

        assertEquals(400, response.getStatusCode().value());
        String body = response.getBody();
        assertTrue(body.contains("username: Username is required"));
        assertTrue(body.contains("password: Password is required"));
    }
}
