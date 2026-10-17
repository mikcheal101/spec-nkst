package com.mikkytrionze.nkst.deacon.application.service;

import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.deacon.api.request.MakeDeaconRequest;
import com.mikkytrionze.nkst.deacon.domain.gateway.DeaconEventPublisher;
import com.mikkytrionze.nkst.deacon.domain.model.Deacon;
import com.mikkytrionze.nkst.deacon.domain.repository.DeaconRepository;
import com.mikkytrionze.nkst.deacon.domain.service.DeaconService;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.application.mapper.MemberMapper;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.member.domain.service.BaptismRecordService;
import com.mikkytrionze.nkst.shared.exception.DuplicateResourceException;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeaconServiceImpl implements DeaconService {

    private final DeaconRepository deaconRepository;
    private final MemberRepository memberRepository;
    private final SecurityUtils securityUtils;
    private final ChurchRepository churchRepository;
    private final BaptismRecordService baptismRecordService;

     private final DeaconEventPublisher deaconEventPublisher;

    @Override
    public Page<MemberResponse> fetchDeacons(Pageable pageable) {
        Church church = securityUtils.getLoggedInUserChurch();

        log.info("Fetching church deacons for church: {}", church.getId());

        // 1. Fetch paginated deacons by church ID
        Page<Member> deacons = deaconRepository.findAllByChurchId(church.getId(), pageable);

        // 2. Map to DTO response
        return deacons.map(MemberMapper::toResponse);
    }

    @Override
    public Page<MemberResponse> searchProspectiveDeacons(String query, Pageable pageable) {
        Church church = securityUtils.getLoggedInUserChurch();

        log.info("Searching prospective deacons in church: {} with query: '{}'", church.getId(), query);

        // 2. Perform search at database level excluding existing deacons
        Page<Member> prospectiveMembers = deaconRepository.searchEligibleMembers(church.getId(), query, pageable);

        // 3. Map to DTO response
        return prospectiveMembers.map(MemberMapper::toResponse);
    }

    @Override
    public MemberResponse getDeacon(Long id) throws ResourceNotFoundException {
        Church church = securityUtils.getLoggedInUserChurch();

        log.info("Fetching deacon with ID: {} for church: {}", id, church.getId());

        // 1. Fetch the deacon member or throw exception
        Member deacon = deaconRepository.findByChurchId(church.getId(), id)
                .orElseThrow(() -> new ResourceNotFoundException("Deacon not found!"));

        // 2. Return DTO version
        return MemberMapper.toResponse(deacon);
    }

    @Override
    @Transactional
    public Boolean createDeacon(MakeDeaconRequest makeDeaconRequest) throws DuplicateResourceException, ResourceNotFoundException {
        log.info("Processing request to promote member {} to deacon", makeDeaconRequest.getMemberId());

        // 1. Check if the member exists
        Member member = memberRepository.findById(makeDeaconRequest.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Deacon", makeDecorRequestSafe(makeDeaconRequest)));

        // 2. Confirm if the member is already a deacon
        deaconRepository.findByChurchId(member.getChurch().getId(), member.getId())
                .ifPresent(d -> {
                    throw new DuplicateResourceException("Member is already a deacon!");
                });

        // 3. Create and save the new Deacon record
        var newDeacon = Deacon.builder()
                .member(member)
                .church(member.getChurch())
                .build();

        var savedDeacon = deaconRepository.save(newDeacon);

        // 4. Publish event if your architecture requires syncing downstream services
         deaconEventPublisher.publishDeaconCreated(DeaconCreatedEvent.builder()
                 .deaconId(savedDeacon.getId())
                 .memberId(savedDeacon.getMember().getId())
                 .userId(savedDeacon.getMember().getUserId())
                 .activate(true)
                 .build());

        log.info("Member {} successfully promoted to deacon", member.getId());
        return true;
    }

    public MemberResponse updateDeacon(final Long id, final UpdateMemberRequest deaconRequest) throws ResourceNotFoundException {
        // 1. Fetch the authenticated user to get the church
        var authenticatedUserChurch = securityUtils.getLoggedInUserChurch();

        // 2. Fetch the deacon
        var deacon = deaconRepository.findByIdAndChurchId(id, authenticatedUserChurch.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Deacon", id));

        // 3. Fetch the associated member.
        var member = deacon.getMember();

        member.setBaptised(deaconRequest.getIsBaptised());
        member.setGender(Gender.valueOf(deaconRequest.getGender()));
        member.setFirstName(deaconRequest.getFirstName());
        member.setLastName(deaconRequest.getLastName());
        member.setMiddleName(deaconRequest.getMiddleName());
        member.setAddress(deaconRequest.getAddress());

        if (deaconRequest.getChurchId() != null) {
            Church church = churchRepository.findById(deaconRequest.getChurchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Church", deaconRequest.getChurchId()));
            member.setChurch(church);
        }

        if (Boolean.TRUE.equals(deaconRequest.getIsBaptised())) {
            BaptismRecord baptismRecord = getBaptismRecord(deaconRequest, member.getBaptismRecord());
            member.setBaptismRecord(baptismRecordService.update(baptismRecord.getId(), baptismRecord));
        }

        Member updatedMember = memberRepository.save(member);

        return MemberMapper.toResponse(updatedMember);
    }

    private Long makeDecorRequestSafe(MakeDeaconRequest request) {
        return request != null ? request.getMemberId() : null;
    }

    private static @NonNull BaptismRecord getBaptismRecord(UpdateMemberRequest memberRequest, BaptismRecord baptismRecord) {
        baptismRecord.setWorshipCenter(memberRequest.getWorshipCenter());
        baptismRecord.setDateOfBaptism(memberRequest.getDateOfBaptism());
        baptismRecord.setSerialNumber(memberRequest.getSerialNumber());
        baptismRecord.setBibleVerse(memberRequest.getBibleVerse());
        baptismRecord.setBaptizedBy(memberRequest.getBaptisedBy());
        baptismRecord.setRemark(memberRequest.getRemark());
        return baptismRecord;
    }
}
