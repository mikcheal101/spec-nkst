package com.mikkytrionze.churchmanagement.shared.security;

import com.mikkytrionze.churchmanagement.shared.dto.response.ErrorResponse;
import com.mikkytrionze.churchmanagement.shared.exception.RateLimitException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    private final ObjectProvider<StringRedisTemplate> redisProvider;
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (redis != null) {
            String key = "rl:api:" + request.getRemoteAddr() + ":" + request.getRequestURI();
            try {
                Long c = redis.opsForValue().increment(key);
                if (c != null && c == 1) redis.expire(key, Duration.ofMinutes(1));
                if (c != null && c > 120) {
                    String corr = request.getHeader("X-Correlation-ID");
                    if (corr == null || corr.isBlank()) corr = UUID.randomUUID().toString();
                    response.setStatus(429); response.setHeader("Retry-After","60"); response.setHeader("X-Correlation-ID",corr); response.setContentType("application/json");
                    response.getWriter().write(mapper.writeValueAsString(ErrorResponse.builder().timestamp(Instant.now()).status(429).error("Too Many Requests").code("RATE_LIMITED").message("Rate limit exceeded").path(request.getRequestURI()).correlationId(corr).details(java.util.Map.of("retryAfterSeconds",60)).build()));
                    return;
                }
            } catch (Exception ignored) {}
        }
        filterChain.doFilter(request, response);
    }
}
