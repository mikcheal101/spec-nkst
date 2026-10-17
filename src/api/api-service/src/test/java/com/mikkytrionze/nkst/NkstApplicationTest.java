package com.mikkytrionze.nkst;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

class NkstApplicationTest {

    @Test
    void shouldInstantiateApplication() {
        assertNotNull(new NkstApplication());
    }

    @Test
    void shouldBeAnnotatedAsSpringBootApplication() {
        assertTrue(NkstApplication.class.isAnnotationPresent(SpringBootApplication.class));
    }
}
