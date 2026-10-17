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

import static org.mockito.Mockito.verify;

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
        authEntryPoint.commence(request, response, authException);

        verify(response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Error: Unauthorized!");
    }
}
