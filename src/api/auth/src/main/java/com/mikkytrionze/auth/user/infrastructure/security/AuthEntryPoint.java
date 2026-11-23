package com.mikkytrionze.auth.user.infrastructure.security;

import com.mikkytrionze.auth.common.application.exception.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.UUID;

@Component
public class AuthEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex) throws IOException {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) correlationId = MDC.get("correlationId");
        if (correlationId == null || correlationId.isBlank()) correlationId = UUID.randomUUID().toString();
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.setHeader("X-Correlation-ID", correlationId);
        ApiErrorResponse body = ApiErrorResponse.of(401, "Unauthorized", "AUTH_UNAUTHORIZED", "Authentication required", request.getRequestURI(), correlationId, null);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
