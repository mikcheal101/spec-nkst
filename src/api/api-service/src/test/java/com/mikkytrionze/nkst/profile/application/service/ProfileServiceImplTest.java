package com.mikkytrionze.nkst.profile.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.profile.api.request.ProfileRequest;
import com.mikkytrionze.nkst.profile.api.response.ProfileResponse;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private ProfileServiceImpl profileService;

    @Test
    void shouldGetProfileWithPhoneNumberAsUsername() {
        Member member = Member.builder()
                .firstName("John")
                .lastName("Doe")
                .emailAddress("john@test.com")
                .tel("1234567890")
                .gender(Gender.MALE)
                .build();

        when(securityUtils.getLoggedInUser()).thenReturn(member);

        ProfileResponse response = profileService.getProfile();

        assertNotNull(response);
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        assertEquals("john@test.com", response.getEmail());
        assertEquals("1234567890", response.getPhoneNumber());
        assertEquals("1234567890", response.getUsername());
    }

    @Test
    void shouldGetProfileWithEmailAsUsernameWhenTelIsNull() {
        Member member = Member.builder()
                .firstName("Jane")
                .lastName("Smith")
                .emailAddress("jane@test.com")
                .gender(Gender.FEMALE)
                .build();

        when(securityUtils.getLoggedInUser()).thenReturn(member);

        ProfileResponse response = profileService.getProfile();

        assertNotNull(response);
        assertEquals("Jane", response.getFirstName());
        assertEquals("Smith", response.getLastName());
        assertEquals("jane@test.com", response.getEmail());
        assertNull(response.getPhoneNumber());
        assertEquals("jane@test.com", response.getUsername());
    }

    @Test
    void shouldGetProfileWithEmptyUsernameWhenTelAndEmailAreNull() {
        Member member = Member.builder()
                .firstName("Alex")
                .lastName("Doe")
                .gender(Gender.MALE)
                .build();

        when(securityUtils.getLoggedInUser()).thenReturn(member);

        ProfileResponse response = profileService.getProfile();

        assertNotNull(response);
        assertNull(response.getUsername());
    }

    @Test
    void shouldUpdateProfile() {
        Member existing = Member.builder()
                .firstName("John")
                .lastName("Doe")
                .emailAddress("john@test.com")
                .tel("1234567890")
                .gender(Gender.MALE)
                .build();

        ProfileRequest request = ProfileRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .middleName("M")
                .tel("0987654321")
                .emailAddress("jane@test.com")
                .build();

        Member updated = Member.builder()
                .firstName("Jane")
                .lastName("Smith")
                .middleName("M")
                .emailAddress("jane@test.com")
                .tel("0987654321")
                .gender(Gender.MALE)
                .build();

        when(securityUtils.getLoggedInUser()).thenReturn(existing);
        when(memberRepository.save(any(Member.class))).thenReturn(updated);

        ProfileResponse response = profileService.updateProfile(request);

        assertNotNull(response);
        assertEquals("Jane", response.getFirstName());
        assertEquals("Smith", response.getLastName());
        assertEquals("jane@test.com", response.getEmail());
        assertEquals("0987654321", response.getPhoneNumber());
        assertEquals("0987654321", response.getUsername());
        verify(memberRepository).save(existing);
    }

    @Test
    void shouldUpdateProfileWithEmailAsUsernameWhenTelIsNull() {
        Member existing = Member.builder()
                .firstName("John")
                .lastName("Doe")
                .emailAddress("john@test.com")
                .tel("1234567890")
                .gender(Gender.MALE)
                .build();

        ProfileRequest request = ProfileRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .emailAddress("jane@test.com")
                .build();

        Member updated = Member.builder()
                .firstName("Jane")
                .lastName("Smith")
                .emailAddress("jane@test.com")
                .gender(Gender.MALE)
                .build();

        when(securityUtils.getLoggedInUser()).thenReturn(existing);
        when(memberRepository.save(any(Member.class))).thenReturn(updated);

        ProfileResponse response = profileService.updateProfile(request);

        assertNotNull(response);
        assertEquals("Jane", response.getFirstName());
        assertEquals("Smith", response.getLastName());
        assertEquals("jane@test.com", response.getEmail());
        assertNull(response.getPhoneNumber());
        assertEquals("jane@test.com", response.getUsername());
    }
}
