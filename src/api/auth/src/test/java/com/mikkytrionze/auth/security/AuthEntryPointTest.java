package com.mikkytrionze.auth.security;

import com.mikkytrionze.auth.user.infrastructure.security.AuthEntryPoint;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.AuthenticationException;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthEntryPointTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private AuthenticationException authException;

    private AuthEntryPoint authEntryPoint;

    @BeforeEach
    void setUp() {
        authEntryPoint = new AuthEntryPoint();
    }

    @Test
    void commence_sendsUnauthorizedError() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/test");
        when(request.getHeader("X-Correlation-ID")).thenReturn("cid-1");
        StringWriter sw = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(sw));

        authEntryPoint.commence(request, response, authException);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(response).setContentType("application/json");
        verify(response).setHeader("X-Correlation-ID", "cid-1");
        String body = sw.toString();
        assertTrue(body.contains("\"AUTH_UNAUTHORIZED\""));
        assertTrue(body.contains("\"status\":401"));
    }
}
