package com.mikkytrionze.churchmanagement.shared.observability;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RequestTimingFilter extends OncePerRequestFilter {
    private final MeterRegistry meterRegistry;
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        long start = System.nanoTime();
        String corr = request.getHeader("X-Correlation-ID"); if (corr==null||corr.isBlank()) corr=MDC.get("correlationId"); if (corr==null||corr.isBlank()) corr=UUID.randomUUID().toString();
        MDC.put("correlationId", corr); response.setHeader("X-Correlation-ID", corr);
        try { filterChain.doFilter(request, response); }
        finally {
            Timer.builder("http.server.request.latency").tag("method",request.getMethod()).tag("uri",request.getRequestURI()).tag("status",String.valueOf(response.getStatus()))
                    .register(meterRegistry).record(System.nanoTime()-start, TimeUnit.NANOSECONDS);
            MDC.remove("correlationId");
        }
    }
}
