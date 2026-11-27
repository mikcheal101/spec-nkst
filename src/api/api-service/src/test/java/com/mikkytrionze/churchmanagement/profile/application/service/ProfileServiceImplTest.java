package com.mikkytrionze.churchmanagement.profile.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.churchmanagement.member.domain.enums.Gender;
import com.mikkytrionze.churchmanagement.member.domain.model.Member;
import com.mikkytrionze.churchmanagement.member.domain.repository.MemberRepository;
import com.mikkytrionze.churchmanagement.profile.api.request.ProfileRequest;
import com.mikkytrionze.churchmanagement.profile.api.response.ProfileResponse;
import com.mikkytrionze.churchmanagement.shared.exception.ProfileContactConflictException;
import com.mikkytrionze.churchmanagement.shared.security.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock private SecurityUtils securityUtils;
    @Mock private MemberRepository memberRepository;
    @InjectMocks private ProfileServiceImpl profileService;

    private Member member() {
        return Member.builder().id(10L).firstName("John").lastName("Doe").middleName("M")
                .emailAddress("john@test.com").tel("1234567890").gender(Gender.MALE).build();
    }

    @Test
    void shouldGetProfileWithPhoneNumberAsUsername() {
        when(securityUtils.getLoggedInUser()).thenReturn(member());
        ProfileResponse response = profileService.getProfile();
        assertEquals("1234567890", response.getUsername());
        assertEquals("john@test.com", response.getEmail());
    }

    @Test
    void shouldNotClobberUnspecifiedFieldsOnPartialSafeUpdate() {
        Member existing = member();
        when(securityUtils.getLoggedInUser()).thenReturn(existing);
        when(memberRepository.existsByTelAndIdNot(anyString(), anyLong())).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfileRequest request = ProfileRequest.builder().firstName("Jane").lastName("Doe").tel("1234567890").build();
        // emailAddress/middleName intentionally omitted (null) -> must not clobber existing values
        ProfileResponse response = profileService.updateProfile(request);

        ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);
        verify(memberRepository).save(captor.capture());
        Member saved = captor.getValue();
        assertEquals("Jane", saved.getFirstName());
        assertEquals("Doe", saved.getLastName());
        assertEquals("M", saved.getMiddleName());
        assertEquals("john@test.com", saved.getEmailAddress());
        assertEquals("1234567890", saved.getTel());
        assertEquals("john@test.com", response.getEmail());
    }

    @Test
    void shouldRejectDuplicateContactWithGenericConflict() {
        when(securityUtils.getLoggedInUser()).thenReturn(member());
        when(memberRepository.existsByTelAndIdNot("9999999999", 10L)).thenReturn(true);

        ProfileRequest request = ProfileRequest.builder().firstName("Jane").lastName("Smith").tel("9999999999").build();
        ProfileContactConflictException ex = assertThrows(ProfileContactConflictException.class, () -> profileService.updateProfile(request));
        assertEquals("Unable to update profile with the provided information.", ex.getMessage());
        verify(memberRepository, never()).save(any());
    }

    @Test
    void shouldAllowSameUserExistingContactValues() {
        Member existing = member();
        when(securityUtils.getLoggedInUser()).thenReturn(existing);
        when(memberRepository.existsByTelAndIdNot("1234567890", 10L)).thenReturn(false);
        when(memberRepository.existsByEmailAddressAndIdNot("john@test.com", 10L)).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfileRequest request = ProfileRequest.builder()
                .firstName("John").lastName("Doe").tel("1234567890").emailAddress("john@test.com").build();
        assertDoesNotThrow(() -> profileService.updateProfile(request));
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    void shouldApplyLastSaveWinsForSequentialUpdates() {
        Member existing = member();
        when(securityUtils.getLoggedInUser()).thenReturn(existing);
        when(memberRepository.existsByTelAndIdNot(anyString(), anyLong())).thenReturn(false);
        when(memberRepository.existsByEmailAddressAndIdNot(anyString(), anyLong())).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfileRequest first = ProfileRequest.builder().firstName("Jane").lastName("Doe").tel("1234567890").emailAddress("jane1@test.com").build();
        ProfileRequest second = ProfileRequest.builder().firstName("Janet").lastName("Doe").tel("1234567890").emailAddress("jane2@test.com").build();

        profileService.updateProfile(first);
        ProfileResponse latest = profileService.updateProfile(second);

        assertEquals("Janet", existing.getFirstName());
        assertEquals("jane2@test.com", existing.getEmailAddress());
        assertEquals("Janet", latest.getFirstName());
        assertEquals("jane2@test.com", latest.getEmail());
        verify(memberRepository, times(2)).save(any(Member.class));
    }

    @Test
    void updateProfile_skipsConflictChecksAndMutationsForNullOrBlankFields() {
        Member m = member();
        when(securityUtils.getLoggedInUser()).thenReturn(m);
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfileRequest request = new ProfileRequest();
        request.setFirstName("  ");
        request.setLastName(null);
        request.setMiddleName("  ");
        request.setEmailAddress(" ");
        request.setTel(" ");

        ProfileResponse response = profileService.updateProfile(request);

        verify(memberRepository, never()).existsByTelAndIdNot(anyString(), anyLong());
        verify(memberRepository, never()).existsByEmailAddressAndIdNot(anyString(), anyLong());
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        assertNull(response.getEmail());
        assertEquals("1234567890", response.getPhoneNumber());
    }

    @Test
    void updateProfile_setsNullWhenOptionalFieldsExplicitlyCleared() {
        Member m = member();
        m.setMiddleName("X");
        m.setEmailAddress("old@test.com");
        when(securityUtils.getLoggedInUser()).thenReturn(m);
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfileRequest request = new ProfileRequest();
        request.setMiddleName("");
        request.setEmailAddress("");

        ProfileResponse response = profileService.updateProfile(request);

        ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);
        verify(memberRepository).save(captor.capture());
        assertNull(captor.getValue().getMiddleName());
        assertNull(captor.getValue().getEmailAddress());
        assertNull(response.getMiddleName());
        assertNull(response.getEmail());
    }

    @Test
    void toResponse_usesEmailAsUsernameWhenTelMissing() {
        Member m = member();
        m.setTel(null);
        m.setEmailAddress("user@test.com");
        when(securityUtils.getLoggedInUser()).thenReturn(m);

        ProfileResponse response = profileService.getProfile();

        assertNull(response.getPhoneNumber());
        assertEquals("user@test.com", response.getEmail());
        assertEquals("user@test.com", response.getUsername());
    }
}
