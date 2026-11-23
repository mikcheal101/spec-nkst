package com.mikkytrionze.churchmanagement.shared.config;

import com.mikkytrionze.churchmanagement.shared.dto.response.ErrorResponse;
import com.mikkytrionze.churchmanagement.shared.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity, JwtAuthFilter jwtAuthFilter, com.mikkytrionze.churchmanagement.shared.security.RateLimitFilter rateLimitFilter) throws Exception {
        return httpSecurity
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> writeError(req, res, HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required"))
                        .accessDeniedHandler((req, res, e) -> writeError(req, res, HttpStatus.FORBIDDEN, "AUTHZ_FORBIDDEN", "Access denied")))
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    private void writeError(jakarta.servlet.http.HttpServletRequest req, jakarta.servlet.http.HttpServletResponse res, HttpStatus status, String code, String message) throws java.io.IOException {
        String corr = req.getHeader("X-Correlation-ID");
        if (corr == null || corr.isBlank()) corr = UUID.randomUUID().toString();
        res.setStatus(status.value());
        res.setContentType("application/json");
        res.setHeader("X-Correlation-ID", corr);
        ErrorResponse body = ErrorResponse.builder().timestamp(Instant.now()).status(status.value()).error(status.getReasonPhrase()).code(code).message(message).path(req.getRequestURI()).correlationId(corr).build();
        res.getWriter().write(objectMapper.writeValueAsString(body));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        corsConfiguration.setAllowedMethods(List.of("GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"));
        corsConfiguration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Correlation-ID"));
        corsConfiguration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource urlBasedCorsConfigurationSource = new UrlBasedCorsConfigurationSource();
        urlBasedCorsConfigurationSource.registerCorsConfiguration("/**", corsConfiguration);
        return urlBasedCorsConfigurationSource;
    }
}
