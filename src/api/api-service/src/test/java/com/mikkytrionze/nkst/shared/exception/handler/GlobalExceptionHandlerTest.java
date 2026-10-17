package com.mikkytrionze.nkst.shared.exception.handler;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.mikkytrionze.nkst.shared.dto.response.ErrorResponse;
import com.mikkytrionze.nkst.shared.exception.BadRequestException;
import com.mikkytrionze.nkst.shared.exception.KafkaMessagingException;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new DummyExceptionController())
                .setControllerAdvice(handler)
                .build();
    }

    @Test
    void shouldHandleDataIntegrityViolation() throws Exception {
        mockMvc.perform(get("/dummy/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("CONFLICT: A record with these details already exist!."))
                .andExpect(jsonPath("$.status").value(HttpStatus.CONFLICT.value()));
    }

    @Test
    void shouldHandleResourceNotFoundException() throws Exception {
        mockMvc.perform(get("/dummy/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Church not found"))
                .andExpect(jsonPath("$.status").value(HttpStatus.NOT_FOUND.value()));
    }

    @Test
    void shouldHandleBadRequestException() throws Exception {
        mockMvc.perform(get("/dummy/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid input"))
                .andExpect(jsonPath("$.status").value(HttpStatus.BAD_REQUEST.value()));
    }

    @Test
    void shouldHandleKafkaMessagingException() throws Exception {
        mockMvc.perform(get("/dummy/kafka-failure"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(HttpStatus.SERVICE_UNAVAILABLE.value()));
    }

    @Test
    void shouldHandleValidationExceptionWithFieldErrors() throws Exception {
        mockMvc.perform(post("/dummy/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("name: must not be blank"))
                .andExpect(jsonPath("$.status").value(HttpStatus.BAD_REQUEST.value()));
    }

    @Test
    void shouldHandleValidationExceptionWithNoFieldErrors() throws Exception {
        MethodParameter parameter = new MethodParameter(
                DummyExceptionController.class.getMethod("validate", ValidationPayload.class), 0);
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(new ValidationPayload(), "validationPayload");
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ErrorResponse> response = handler.handleValidationException(exception);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Validation failed", response.getBody().getMessage());
        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getBody().getStatus());
    }

    @Test
    void shouldHandleIllegalArgumentException() throws Exception {
        mockMvc.perform(get("/dummy/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("illegal"))
                .andExpect(jsonPath("$.status").value(HttpStatus.BAD_REQUEST.value()));
    }

    @Test
    void shouldHandleGenericException() throws Exception {
        mockMvc.perform(get("/dummy/generic"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred. Please try again later."))
                .andExpect(jsonPath("$.status").value(HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }

    @RestController
    @RequestMapping("/dummy")
    static class DummyExceptionController {

        @GetMapping("/conflict")
        public String conflict() {
            throw new DataIntegrityViolationException("duplicate");
        }

        @GetMapping("/not-found")
        public String notFound() {
            throw new ResourceNotFoundException("Church not found");
        }

        @GetMapping("/bad-request")
        public String badRequest() {
            throw new BadRequestException("Invalid input");
        }

        @GetMapping("/kafka-failure")
        public String kafkaFailure() {
            throw new KafkaMessagingException(new RuntimeException("kafka is down"));
        }

        @PostMapping("/validate")
        public String validate(@Valid @RequestBody ValidationPayload payload) {
            return "ok";
        }

        @GetMapping("/illegal-argument")
        public String illegalArgument() {
            throw new IllegalArgumentException("illegal");
        }

        @GetMapping("/generic")
        public String generic() {
            throw new RuntimeException("unexpected");
        }
    }

    static class ValidationPayload {

        @NotBlank(message = "must not be blank")
        private String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}
