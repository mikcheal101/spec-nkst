package com.mikkytrionze.announcement.security;

import com.mikkytrionze.announcement.shared.exception.ErrorResponse;
import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final TokenRevocationService revocationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String corr = request.getHeader("X-Correlation-ID");
        if (corr == null || corr.isBlank()) corr = UUID.randomUUID().toString();
        MDC.put("correlationId", corr);
        response.setHeader("X-Correlation-ID", corr);
        try {
            String token = extract(request);
            if (StringUtils.hasText(token)) {
                if (!jwtUtil.validateJwt(token)) { write401(request, response, corr, "AUTH_UNAUTHORIZED"); return; }
                String jti = jwtUtil.getTokenIdFromToken(token);
                if (revocationService.isBlacklisted(jti)) { write401(request, response, corr, "AUTH_TOKEN_REVOKED"); return; }
                Object uidObj = jwtUtil.getAllClaims(token).get("uid");
                Object epochObj = jwtUtil.getAllClaims(token).get("perm_epoch");
                Long uid = uidObj instanceof Number n ? n.longValue() : null;
                Long epoch = epochObj instanceof Number n ? n.longValue() : null;
                if (revocationService.isEpochStale(uid, epoch)) { write401(request, response, corr, "AUTH_TOKEN_STALE"); return; }
                String subject = jwtUtil.getSubject(token);
                List<?> raw = jwtUtil.getClaim(token, "authorities", List.class);
                List<SimpleGrantedAuthority> auths = raw == null ? List.of() : raw.stream().map(a -> new SimpleGrantedAuthority(String.valueOf(a))).toList();
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(subject, null, auths));
            }
            filterChain.doFilter(request, response);
        } finally { MDC.remove("correlationId"); }
    }
    private void write401(HttpServletRequest request, HttpServletResponse response, String corr, String code) throws IOException {
        response.setStatus(401); response.setContentType("application/json"); response.setHeader("X-Correlation-ID", corr);
        response.getWriter().write(objectMapper.writeValueAsString(new ErrorResponse(Instant.now(),401,"Unauthorized",code,"Authentication required",request.getRequestURI(),corr,null)));
    }
    private String extract(HttpServletRequest request) {
        String h = request.getHeader("Authorization");
        return h != null && h.startsWith("Bearer ") ? h.substring(7) : null;
    }
}
