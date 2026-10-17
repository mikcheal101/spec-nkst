package com.mikkytrionze.nkst.shared.exception;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

class ResourceNotFoundExceptionTest {

    @Test
    void shouldCreateExceptionWithMessage() {
        ResourceNotFoundException exception = new ResourceNotFoundException("Church not found");
        assertEquals("Church not found", exception.getMessage());
    }

    @Test
    void shouldCreateExceptionWithResourceAndId() {
        ResourceNotFoundException exception = new ResourceNotFoundException("Church", 1L);
        assertEquals("Church not found with id: 1", exception.getMessage());
    }

    @Test
    void shouldHaveNotFoundStatus() {
        ResponseStatus annotation = ResourceNotFoundException.class.getAnnotation(ResponseStatus.class);
        assertNotNull(annotation);
        assertEquals(HttpStatus.NOT_FOUND, annotation.value());
    }
}
