package com.mikkytrionze.churchmanagement.profile.api;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mikkytrionze.churchmanagement.profile.api.request.ProfileRequest;
import com.mikkytrionze.churchmanagement.profile.api.response.ProfileResponse;
import com.mikkytrionze.churchmanagement.profile.domain.service.ProfileService;
import com.mikkytrionze.churchmanagement.shared.exception.ProfileContactConflictException;
import com.mikkytrionze.churchmanagement.shared.exception.RateLimitException;
import com.mikkytrionze.churchmanagement.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.churchmanagement.shared.exception.handler.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class ProfileControllerTest {

    private MockMvc mockMvc;
    private final ProfileService profileService = mock(ProfileService.class);
    private final ProfileController profileController = new ProfileController(profileService);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(profileController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void shouldGetProfile() throws Exception {
        ProfileResponse response = ProfileResponse.builder()
                .firstName("John").lastName("Doe").email("john@test.com")
                .phoneNumber("+1 (234) 567-8901").username("+1 (234) 567-8901").build();
        when(profileService.getProfile()).thenReturn(response);

        mockMvc.perform(get("/api/v1/profile").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.username").value("+1 (234) 567-8901"));
        verify(profileService).getProfile();
    }

    @Test
    void shouldUpdateProfile() throws Exception {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Jane").lastName("Smith").middleName("M")
                .tel("+1 (234) 567-8901").emailAddress("jane@test.com").build();
        ProfileResponse response = ProfileResponse.builder()
                .firstName("Jane").lastName("Smith").middleName("M")
                .email("jane@test.com").phoneNumber("+1 (234) 567-8901").username("+1 (234) 567-8901").build();
        when(profileService.updateProfile(any(ProfileRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.phoneNumber").value("+1 (234) 567-8901"));
        verify(profileService).updateProfile(any(ProfileRequest.class));
    }

    @Test
    void shouldRejectInvalidEmailAndPhoneFormat() throws Exception {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Jane").lastName("Smith").tel("12ab").emailAddress("bad-email").build();

        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.fieldErrors").isArray());
        verify(profileService, never()).updateProfile(any());
    }

    @Test
    void shouldAllowOptionalEmailWhenOmittedOrBlank() throws Exception {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Jane").lastName("Smith").tel("1234567").emailAddress("").build();
        when(profileService.updateProfile(any(ProfileRequest.class))).thenReturn(
                ProfileResponse.builder().firstName("Jane").lastName("Smith").phoneNumber("1234567").username("1234567").build());

        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnGeneric409ForDuplicateContactConflict() throws Exception {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Jane").lastName("Smith").tel("1234567890").emailAddress("jane@test.com").build();
        when(profileService.updateProfile(any(ProfileRequest.class))).thenThrow(new ProfileContactConflictException());

        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROFILE_CONTACT_CONFLICT"))
                .andExpect(jsonPath("$.message").value("Unable to update profile with the provided information."))
                .andExpect(jsonPath("$.details").doesNotExist());
    }

    @Test
    void getProfile_shouldMap401() throws Exception {
        when(profileService.getProfile()).thenThrow(new AuthenticationException("bad") {});
        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
    }

    @Test
    void getProfile_shouldMap403() throws Exception {
        when(profileService.getProfile()).thenThrow(new AccessDeniedException("denied"));
        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTHZ_FORBIDDEN"));
    }

    @Test
    void getProfile_shouldMap404() throws Exception {
        when(profileService.getProfile()).thenThrow(new ResourceNotFoundException("Authenticated user not found"));
        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void getProfile_shouldMap429() throws Exception {
        when(profileService.getProfile()).thenThrow(new RateLimitException("Too many requests", 60));
        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void updateProfile_shouldMap401() throws Exception {
        ProfileRequest request = ProfileRequest.builder().firstName("Jane").lastName("Smith").tel("1234567890").build();
        when(profileService.updateProfile(any(ProfileRequest.class))).thenThrow(new AuthenticationException("bad") {});
        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
    }

    @Test
    void updateProfile_shouldMap403() throws Exception {
        ProfileRequest request = ProfileRequest.builder().firstName("Jane").lastName("Smith").tel("1234567890").build();
        when(profileService.updateProfile(any(ProfileRequest.class))).thenThrow(new AccessDeniedException("denied"));
        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTHZ_FORBIDDEN"));
    }

    @Test
    void updateProfile_shouldMap404() throws Exception {
        ProfileRequest request = ProfileRequest.builder().firstName("Jane").lastName("Smith").tel("1234567890").build();
        when(profileService.updateProfile(any(ProfileRequest.class))).thenThrow(new ResourceNotFoundException("Authenticated user not found"));
        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void updateProfile_shouldMap429() throws Exception {
        ProfileRequest request = ProfileRequest.builder().firstName("Jane").lastName("Smith").tel("1234567890").build();
        when(profileService.updateProfile(any(ProfileRequest.class))).thenThrow(new RateLimitException("Too many requests", 60));
        mockMvc.perform(post("/api/v1/profile").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }
}
