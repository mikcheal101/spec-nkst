package com.mikkytrionze.announcement.config;

import com.mikkytrionze.announcement.security.JwtAuthFilter;
import com.mikkytrionze.announcement.shared.exception.ErrorResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    private final ObjectMapper mapper = new ObjectMapper();
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwt, com.mikkytrionze.announcement.security.RateLimitFilter rateLimitFilter) throws Exception {
        return http.csrf(csrf->csrf.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex->ex.authenticationEntryPoint((req,res,e)->write(req,res,401,"AUTH_UNAUTHORIZED","Authentication required"))
                        .accessDeniedHandler((req,res,e)->write(req,res,403,"AUTHZ_FORBIDDEN","Access denied")))
                .authorizeHttpRequests(a->a.anyRequest().authenticated())
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class).build();
    }
    private void write(jakarta.servlet.http.HttpServletRequest req, jakarta.servlet.http.HttpServletResponse res, int status, String code, String msg) throws java.io.IOException {
        String corr = req.getHeader("X-Correlation-ID"); if (corr==null||corr.isBlank()) corr=UUID.randomUUID().toString();
        res.setStatus(status); res.setContentType("application/json"); res.setHeader("X-Correlation-ID", corr);
        res.getWriter().write(mapper.writeValueAsString(new ErrorResponse(Instant.now(),status, HttpStatus.valueOf(status).getReasonPhrase(),code,msg,req.getRequestURI(),corr,null)));
    }
}
