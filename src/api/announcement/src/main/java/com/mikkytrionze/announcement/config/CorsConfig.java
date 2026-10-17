package com.mikkytrionze.announcement.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Value("#{'${cors.allowed-origins:*}'.split(',')}")
    private List<String> allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        var source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // 1. Disallow cookies
        config.setAllowCredentials(false);

        // 2. Specify allowed origins
        config.setAllowedOrigins(allowedOrigins);

        // 3. Specify allowed headers
        config.setAllowedHeaders(List.of("*"));

        // 4. Specify allowed methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
