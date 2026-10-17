package com.mikkytrionze.nkst.elder.application.service;

import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.elder.api.request.MakeElderRequest;
import com.mikkytrionze.nkst.elder.domain.gateway.ElderEventPublisher;
import com.mikkytrionze.nkst.elder.domain.model.Elder;
import com.mikkytrionze.nkst.elder.domain.repository.ElderRepository;
import com.mikkytrionze.nkst.elder.domain.service.ElderService;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.application.mapper.MemberMapper;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.shared.exception.DuplicateResourceException;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElderServiceImpl implements ElderService {

    private final MemberRepository memberRepository;
    private final SecurityUtils securityUtils;
    private final ElderRepository elderRepository;
    private final ElderEventPublisher elderEventPublisher;

    @Override
    public Page<MemberResponse> getElders(Pageable pageable) {
        Church church = securityUtils.getLoggedInUserChurch();

        log.info("Fetching church elders for church: {}", church.getId());

        // 1. Repository now returns Page<Member> correctly
        Page<Member> elders = elderRepository.findAllByChurchId(church.getId(), pageable);

        // 2. Map to DTO
        return elders.map(MemberMapper::toResponse);
    }

    @Override
    public MemberResponse getElder(Long elderId) {
        Church church = securityUtils.getLoggedInUserChurch();

        log.info("Fetching Elder :{} for church: {}", elderId, church.getId());

        // 1. Fetch the elder or throw exception
        Member elder = elderRepository.findByChurchId(church.getId(), elderId)
                .orElseThrow(() -> new ResourceNotFoundException("Elder not found!"));

        // 2. return the dto version
        return MemberMapper.toResponse(elder);
    }

    @Override
    @Transactional
    public Boolean makeElder(MakeElderRequest makeElderRequest) {
        log.info("Promoting member {} to elder", makeElderRequest.getMemberId());

        // 1. Check if the member exists
        Member member = memberRepository.findById(makeElderRequest.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Elder", makeElderRequest.getMemberId()));

        // 2. Confirm if the member is already an elder (Using orElseThrow for cleaner flow)
        elderRepository.findByChurchId(member.getChurch().getId(), member.getId())
                .ifPresent(e -> {
                    throw new DuplicateResourceException("Member is already an elder!");
                });

        // 3. Create and save the new Elder record
        Elder newElder = Elder.builder()
                .member(member)
                .church(member.getChurch())
                .build();

        Elder elder = elderRepository.save(newElder);

        // 4. Emit Kafka event to update the user service.
        elderEventPublisher.publishElderCreated(ElderCreatedEvent.builder()
                .elderId(elder.getId())
                .activate(Boolean.TRUE)
                .userId(elder.getMember().getUserId())
                .memberId(elder.getMember().getId())
                .build());

        log.info("Member {} successfully promoted to elder", member.getId());
        return true;

    }

    @Override
    public Page<MemberResponse> searchEligibleMembersForElder(String query, Pageable pageable) throws ResourceNotFoundException {
        // 1. Get the user's Church using the existing helper method
        Church church = securityUtils.getLoggedInUserChurch();

        log.info("Searching eligible members for elder in church: {} with query: '{}'", church.getId(), query);

        // 2. Perform search at the database level with pagination (handles the query filter)
        Page<Member> churchMembers = elderRepository.searchEligibleMembers(church.getId(), query, pageable);

        // 3. Map to DTO response
        return churchMembers.map(MemberMapper::toResponse);
    }
}
