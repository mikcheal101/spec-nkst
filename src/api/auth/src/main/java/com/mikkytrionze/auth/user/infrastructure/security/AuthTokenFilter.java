package com.mikkytrionze.auth.user.infrastructure.security;

import com.mikkytrionze.auth.common.application.exception.ApiErrorResponse;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.domain.service.TokenBlacklistService;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthTokenFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) correlationId = UUID.randomUUID().toString();
        MDC.put("correlationId", correlationId);
        response.setHeader("X-Correlation-ID", correlationId);
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtil.validateJwt(jwt)) {
                String jti = jwtUtil.getTokenIdFromToken(jwt);
                if (tokenBlacklistService.isBlacklisted(jti)) {
                    writeError(request, response, correlationId, HttpStatus.UNAUTHORIZED, "AUTH_TOKEN_REVOKED", "Authentication required");
                    return;
                }
                String username = jwtUtil.getUsernameFromToken(jwt);
                User user = userRepository.findByUsername(username).orElse(null);
                if (user == null || user.getAccountStatus() != AccountStatus.ACTIVE) {
                    writeError(request, response, correlationId, HttpStatus.UNAUTHORIZED, "AUTH_ACCOUNT_NOT_ELIGIBLE", "Account is not eligible for authentication");
                    return;
                }
                Long epochClaim = null;
                try { Object c = jwtUtil.getAllClaims(jwt).get("perm_epoch"); if (c instanceof Number n) epochClaim = n.longValue(); } catch (Exception ignored) {}
                if (epochClaim != null && epochClaim != user.getPermissionEpoch()) {
                    writeError(request, response, correlationId, HttpStatus.UNAUTHORIZED, "AUTH_TOKEN_STALE", "Authentication required");
                    return;
                }
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void writeError(HttpServletRequest request, HttpServletResponse response, String correlationId, HttpStatus status, String code, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setHeader("X-Correlation-ID", correlationId);
        ApiErrorResponse body = ApiErrorResponse.of(status.value(), status.getReasonPhrase(), code, message, request.getRequestURI(), correlationId, null);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth != null && headerAuth.startsWith("Bearer")) {
            return headerAuth.substring("Bearer".length() + 1);
        }
        return null;
    }
}
