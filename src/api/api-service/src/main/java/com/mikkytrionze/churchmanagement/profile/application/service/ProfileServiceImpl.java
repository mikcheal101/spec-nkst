package com.mikkytrionze.churchmanagement.profile.application.service;

import com.mikkytrionze.churchmanagement.member.domain.model.Member;
import com.mikkytrionze.churchmanagement.member.domain.repository.MemberRepository;
import com.mikkytrionze.churchmanagement.profile.api.request.ProfileRequest;
import com.mikkytrionze.churchmanagement.profile.api.response.ProfileResponse;
import com.mikkytrionze.churchmanagement.profile.domain.service.ProfileService;
import com.mikkytrionze.churchmanagement.shared.exception.ProfileContactConflictException;
import com.mikkytrionze.churchmanagement.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final SecurityUtils securityUtils;
    private final MemberRepository memberRepository;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfile() {
        Member authenticatedMember = securityUtils.getLoggedInUser();
        return toResponse(authenticatedMember);
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(ProfileRequest request) {
        Member existingMember = securityUtils.getLoggedInUser();
        Long memberId = existingMember.getId();

        String firstName = trimToNull(request.getFirstName());
        String lastName = trimToNull(request.getLastName());
        String middleName = trimToNull(request.getMiddleName());
        String tel = trimToNull(request.getTel());
        String email = trimToNull(request.getEmailAddress());

        if (tel != null && memberRepository.existsByTelAndIdNot(tel, memberId)) {
            throw new ProfileContactConflictException();
        }
        if (email != null && memberRepository.existsByEmailAddressAndIdNot(email, memberId)) {
            throw new ProfileContactConflictException();
        }

        // Partial-safe/no-clobber: only supported editable fields are mutated.
        if (firstName != null) existingMember.setFirstName(firstName);
        if (lastName != null) existingMember.setLastName(lastName);
        if (request.getMiddleName() != null) existingMember.setMiddleName(middleName);
        if (request.getEmailAddress() != null) existingMember.setEmailAddress(email);
        if (tel != null) existingMember.setTel(tel);

        Member updatedMember = memberRepository.save(existingMember);
        return toResponse(updatedMember);
    }

    private ProfileResponse toResponse(Member member) {
        String tel = trimToNull(member.getTel());
        String email = trimToNull(member.getEmailAddress());
        return ProfileResponse.builder()
                .firstName(trimToNull(member.getFirstName()))
                .middleName(trimToNull(member.getMiddleName()))
                .lastName(trimToNull(member.getLastName()))
                .email(email)
                .phoneNumber(tel)
                .username(tel != null ? tel : email)
                .build();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
