package com.mikkytrionze.nkst.profile.api.response;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class ProfileResponseTest {

    @Test
    void shouldBuildProfileResponseWithAllFields() {
        ProfileResponse response = ProfileResponse.builder()
                .firstName("John")
                .middleName("M")
                .lastName("Doe")
                .email("john@test.com")
                .phoneNumber("1234567890")
                .username("john123")
                .build();

        assertEquals("John", response.getFirstName());
        assertEquals("M", response.getMiddleName());
        assertEquals("Doe", response.getLastName());
        assertEquals("john@test.com", response.getEmail());
        assertEquals("1234567890", response.getPhoneNumber());
        assertEquals("john123", response.getUsername());
    }

    @Test
    void shouldSupportNoArgsConstructor() {
        ProfileResponse response = new ProfileResponse();

        assertNotNull(response);
        assertNull(response.getFirstName());
    }

    @Test
    void shouldSupportAllArgsConstructor() {
        ProfileResponse response = new ProfileResponse(
                "John", "M", "Doe", "john@test.com", "1234567890", "john123");

        assertEquals("John", response.getFirstName());
        assertEquals("M", response.getMiddleName());
        assertEquals("Doe", response.getLastName());
        assertEquals("john@test.com", response.getEmail());
        assertEquals("1234567890", response.getPhoneNumber());
        assertEquals("john123", response.getUsername());
    }

    @Test
    void shouldSupportSettersAndGetters() {
        ProfileResponse response = new ProfileResponse();
        response.setFirstName("Jane");
        response.setMiddleName("A");
        response.setLastName("Smith");
        response.setEmail("jane@test.com");
        response.setPhoneNumber("0987654321");
        response.setUsername("jane123");

        assertEquals("Jane", response.getFirstName());
        assertEquals("A", response.getMiddleName());
        assertEquals("Smith", response.getLastName());
        assertEquals("jane@test.com", response.getEmail());
        assertEquals("0987654321", response.getPhoneNumber());
        assertEquals("jane123", response.getUsername());
    }

    @Test
    void shouldSupportToBuilder() {
        ProfileResponse response = ProfileResponse.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@test.com")
                .build();

        ProfileResponse copy = response.toBuilder().lastName("Smith").build();

        assertEquals("John", copy.getFirstName());
        assertEquals("Smith", copy.getLastName());
        assertEquals("john@test.com", copy.getEmail());
    }
}
