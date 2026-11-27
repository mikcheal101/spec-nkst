package com.mikkytrionze.churchmanagement.shared.security;

import com.mikkytrionze.churchmanagement.shared.dto.response.ErrorResponse;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final TokenRevocationService revocationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) correlationId = UUID.randomUUID().toString();
        MDC.put("correlationId", correlationId);
        response.setHeader("X-Correlation-ID", correlationId);
        try {
            String token = extracStringToken(request);
            if (StringUtils.hasText(token)) {
                if (!jwtUtil.validateJwt(token)) { write401(request, response, correlationId, "AUTH_UNAUTHORIZED"); return; }
                String jti = jwtUtil.getTokenIdFromToken(token);
                if (revocationService.isBlacklisted(jti)) { write401(request, response, correlationId, "AUTH_TOKEN_REVOKED"); return; }
                Object uidObj = jwtUtil.getAllClaims(token).get("uid");
                Object epochObj = jwtUtil.getAllClaims(token).get("perm_epoch");
                Long uid = uidObj instanceof Number n ? n.longValue() : null;
                Long epoch = epochObj instanceof Number n ? n.longValue() : null;
                if (revocationService.isEpochStale(uid, epoch)) { write401(request, response, correlationId, "AUTH_TOKEN_STALE"); return; }
                String subject = jwtUtil.getSubject(token);
                List<?> raw = jwtUtil.getClaim(token, "authorities", List.class);
                List<SimpleGrantedAuthority> authorities = raw == null ? List.of() : raw.stream().map(a -> new SimpleGrantedAuthority(a.toString())).toList();
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(subject, null, authorities);
                Map<String, Object> details = new HashMap<>();
                if (uid != null) details.put("uid", uid);
                authenticationToken.setDetails(details);
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void write401(HttpServletRequest request, HttpServletResponse response, String correlationId, String code) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.setHeader("X-Correlation-ID", correlationId);
        ErrorResponse body = ErrorResponse.builder().timestamp(Instant.now()).status(401).error("Unauthorized").code(code)
                .message("Authentication required").path(request.getRequestURI()).correlationId(correlationId).build();
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    public String extracStringToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) return bearerToken.substring(7);
        return null;
    }
}
