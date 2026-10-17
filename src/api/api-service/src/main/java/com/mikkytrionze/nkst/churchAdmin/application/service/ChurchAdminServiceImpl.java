package com.mikkytrionze.nkst.churchAdmin.application.service;

import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.churchAdmin.domain.gateway.ChurchAdminEventPublisher;
import com.mikkytrionze.nkst.churchAdmin.domain.service.ChurchAdminService;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChurchAdminServiceImpl implements ChurchAdminService {

    private final MemberRepository memberRepository;
    private final ChurchRepository churchRepository;
    private final ChurchAdminEventPublisher churchAdminEventPublisher;

    @Override
    public Boolean setChurchAdmin(Long memberId) throws ResourceNotFoundException {

        // 1. Get the member.
        String exception = String.format("Member not found with id: %s",  memberId);
        Member newAdmin = this.memberRepository
                .findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException(exception));

        // 2.a. Ensure that the church has no other admin.
        Long churchId = newAdmin.getChurch().getId();
        this.memberRepository
                .findByChurchIdAndIsAdminTrue(churchId)
                .ifPresent(existingAdmin -> {
                    log.info("Downgrading existing admin: {}", existingAdmin.getId());
                    existingAdmin.setAdmin(Boolean.FALSE);
                    this.memberRepository.save(existingAdmin);

                    // 2.b. Publish to user service the drop in user role.
                    if (existingAdmin.getUserId() != null) {
                        churchAdminEventPublisher.publishChurchAdminUpdated(ChurchAdminUpdatedEvent.builder()
                                .activate(false)
                                .churchId(churchId)
                                .memberId(existingAdmin.getUserId())
                                .build());
                    }
                });

        // 3. Upgrade the new member.
        log.info("Promoting the new admin: {}", newAdmin.getId());
        newAdmin.setAdmin(Boolean.TRUE);
        this.memberRepository.save(newAdmin);

        // 4. Publish to user service the change in user role.
        if (newAdmin.getUserId() != null) {
            churchAdminEventPublisher.publishChurchAdminUpdated(ChurchAdminUpdatedEvent.builder()
                    .activate(true)
                    .memberId(newAdmin.getUserId())
                    .churchId(churchId)
                    .build());
        }
        return true;
    }

    @Override
    public Boolean churchHasAdmin(Long churchId) throws ResourceNotFoundException {
        // 1. Get the church
        this.churchRepository.findById(churchId)
                .orElseThrow(() -> new ResourceNotFoundException("Church not found with id: " + churchId));

        // 2. Check for the admin
        Optional<Member> churchAdmin = this.memberRepository.findByChurchIdAndIsAdminTrue(churchId);

        // 3. true if present
        return churchAdmin.isPresent();
    }
}
