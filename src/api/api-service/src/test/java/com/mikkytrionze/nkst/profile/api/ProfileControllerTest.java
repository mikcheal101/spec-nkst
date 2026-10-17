package com.mikkytrionze.nkst.profile.api;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mikkytrionze.nkst.profile.api.request.ProfileRequest;
import com.mikkytrionze.nkst.profile.api.response.ProfileResponse;
import com.mikkytrionze.nkst.profile.domain.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ProfileControllerTest {

    private MockMvc mockMvc;

    private final ProfileService profileService = mock(ProfileService.class);

    private final ProfileController profileController = new ProfileController(profileService);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(profileController).build();
    }

    @Test
    void shouldGetProfile() throws Exception {
        ProfileResponse response = ProfileResponse.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@test.com")
                .phoneNumber("1234567890")
                .username("1234567890")
                .build();

        when(profileService.getProfile()).thenReturn(response);

        mockMvc.perform(get("/api/v1/profile")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.email").value("john@test.com"))
                .andExpect(jsonPath("$.phoneNumber").value("1234567890"))
                .andExpect(jsonPath("$.username").value("1234567890"));

        verify(profileService).getProfile();
    }

    @Test
    void shouldUpdateProfile() throws Exception {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .middleName("M")
                .tel("0987654321")
                .emailAddress("jane@test.com")
                .build();

        ProfileResponse response = ProfileResponse.builder()
                .firstName("Jane")
                .lastName("Smith")
                .email("jane@test.com")
                .phoneNumber("0987654321")
                .username("0987654321")
                .build();

        when(profileService.updateProfile(any(ProfileRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.lastName").value("Smith"))
                .andExpect(jsonPath("$.email").value("jane@test.com"))
                .andExpect(jsonPath("$.phoneNumber").value("0987654321"))
                .andExpect(jsonPath("$.username").value("0987654321"));

        verify(profileService).updateProfile(any(ProfileRequest.class));
    }
}
