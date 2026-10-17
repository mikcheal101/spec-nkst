package com.mikkytrionze.nkst.profile.application.service;

import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.profile.api.request.ProfileRequest;
import com.mikkytrionze.nkst.profile.api.response.ProfileResponse;
import com.mikkytrionze.nkst.profile.domain.service.ProfileService;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
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

    public ProfileResponse getProfile() {
        log.info("Fetching profile details for currently authenticated user");

        // 1. Get the authenticated user to fetch the member details
        Member authenticatedMember = securityUtils.getLoggedInUser();

        log.info("Successfully retrieved profile for user ID: {}", authenticatedMember.getId());

        // 2. convert to ProfileResponse
        String username = authenticatedMember.getTel() != null ? authenticatedMember.getTel() : authenticatedMember.getEmailAddress();

        // 3. return the built response
        return ProfileResponse.builder()
                .email(authenticatedMember.getEmailAddress())
                .firstName(authenticatedMember.getFirstName())
                .lastName(authenticatedMember.getLastName())
                .username(username)
                .phoneNumber(authenticatedMember.getTel())
                .build();
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(ProfileRequest request) {
        log.info("Processing request to update profile for currently authenticated user");

        // 1. Get the currently authenticated user
        Member authenticatedMember = securityUtils.getLoggedInUser();

        // 2. Update mutable fields from the request
        authenticatedMember.setFirstName(request.getFirstName());
        authenticatedMember.setLastName(request.getLastName());
        authenticatedMember.setMiddleName(request.getMiddleName());
        authenticatedMember.setTel(request.getTel());
        authenticatedMember.setEmailAddress(request.getEmailAddress());

        // 3. Save the updated member record
        Member savedMember = memberRepository.save(authenticatedMember);
        log.info("Successfully updated profile for user with ID: {}", savedMember.getId());

        // 4. Determine username fallback for response
        String username = savedMember.getTel() != null ? savedMember.getTel() : savedMember.getEmailAddress();

        // 5. Build and return the response
        return ProfileResponse.builder()
                .email(savedMember.getEmailAddress())
                .firstName(savedMember.getFirstName())
                .lastName(savedMember.getLastName())
                .username(username)
                .phoneNumber(savedMember.getTel())
                .build();
    }
}
