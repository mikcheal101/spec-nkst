package com.mikkytrionze.nkst.shared.exception;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

class BadRequestExceptionTest {

    @Test
    void shouldCreateExceptionWithMessage() {
        BadRequestException exception = new BadRequestException("Invalid request");
        assertEquals("Invalid request", exception.getMessage());
    }

    @Test
    void shouldCreateExceptionWithMessageAndId() {
        BadRequestException exception = new BadRequestException("Entity not found", 42L);
        assertEquals("Entity not found 42", exception.getMessage());
    }

    @Test
    void shouldHaveBadRequestStatus() {
        ResponseStatus annotation = BadRequestException.class.getAnnotation(ResponseStatus.class);
        assertNotNull(annotation);
        assertEquals(HttpStatus.BAD_REQUEST, annotation.value());
    }
}
