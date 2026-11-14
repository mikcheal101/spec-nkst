package com.mikkytrionze.churchmanagement;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

class ChurchManagementApplicationTest {

    @Test
    void shouldInstantiateApplication() {
        assertNotNull(new ChurchManagementApplication());
    }

    @Test
    void shouldBeAnnotatedAsSpringBootApplication() {
        assertTrue(ChurchManagementApplication.class.isAnnotationPresent(SpringBootApplication.class));
    }
}
