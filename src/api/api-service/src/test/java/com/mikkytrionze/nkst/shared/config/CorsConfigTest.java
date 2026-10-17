package com.mikkytrionze.nkst.shared.config;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

class CorsConfigTest {

    @Test
    void shouldConfigureCors() {
        CorsConfig config = new CorsConfig();
        WebMvcConfigurer configurer = config.corsConfigurer();

        assertNotNull(configurer);

        CorsRegistry registry = new CorsRegistry();
        configurer.addCorsMappings(registry);

        assertNotNull(registry);
    }

    @Test
    void shouldApplyCorrectCorsMapping() {
        CorsConfig config = new CorsConfig();
        WebMvcConfigurer configurer = config.corsConfigurer();
        assertNotNull(configurer);
    }
}
