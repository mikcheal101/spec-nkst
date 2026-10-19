package com.mikkytrionze.nkst.member.application.service;

import com.mikkytrionze.member.application.dto.MemberCreatedEvent;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.member.api.request.MemberRequest;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.application.mapper.MemberMapper;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.gateway.MemberEventPublisher;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.member.domain.service.BaptismRecordService;
import com.mikkytrionze.nkst.member.domain.service.MemberService;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.nkst.shared.exception.DuplicateResourceException;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
import com.mikkytrionze.role.application.dto.ERole;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final BaptismRecordService baptismRecordService;
    private final ChurchRepository churchRepository;
    private final MemberEventPublisher memberEventPublisher;
    private final SecurityUtils securityUtils;

    @Override
    public MemberResponse getById(Long id) {
        log.info("Getting Member by Id: {}", id);

        Member member = findById(id, null);

        return MemberMapper.toResponse(member);
    }

    @Override
    public Member findMemberById(Long id) {
        log.info("Finding Member by Id: {}", id);

        return findById(id, null);
    }

    @Override
    public void deleteMember(Long id) {
        log.info("Deleting Member with id: {}", id);

        Member member = findById(id, null);

        member.setDeleted(true);

        memberRepository.save(member);
    }

    @Override
    @Transactional
    public MemberResponse saveMember(MemberRequest memberRequest) {
        Church church = churchRepository.findById(memberRequest.getChurchId())
                .orElseThrow(() -> new ResourceNotFoundException("Church", memberRequest.getChurchId()));

        Member member = Member.builder()
                .tel(memberRequest.getTel())
                .firstName(memberRequest.getFirstName())
                .middleName(memberRequest.getMiddleName())
                .lastName(memberRequest.getLastName())
                .emailAddress(memberRequest.getEmailAddress())
                .gender(Gender.valueOf(memberRequest.getGender().toUpperCase()))
                .isBaptised(memberRequest.getIsBaptised())
                .address(memberRequest.getAddress())
                .church(church)
                .build();

        if (Boolean.TRUE.equals(memberRequest.getIsBaptised())) {
            BaptismRecord baptismRecord = BaptismRecord.builder()
                    .dateOfBaptism(memberRequest.getDateOfBaptism())
                    .bibleVerse(memberRequest.getBibleVerse())
                    .serialNumber(memberRequest.getSerialNumber())
                    .baptizedBy(memberRequest.getBaptisedBy())
                    .worshipCenter(memberRequest.getWorshipCenter())
                    .remark(memberRequest.getRemark())
                    .build();
            member.setBaptismRecord(baptismRecordService.save(baptismRecord));
        }

        Member savedMember = memberRepository.save(member);

        // publish member to kafka
        MemberCreatedEvent memberCreatedEvent = MemberCreatedEvent.builder()
                .memberId(savedMember.getId())
                .username(savedMember.getTel().trim().isBlank() ? savedMember.getEmailAddress().trim().toLowerCase()
                        : savedMember.getTel().trim())
                .password(null)
                .roles(List.of(
                        Boolean.TRUE.equals(
                                memberRequest.getIsBaptised()) ? ERole.MEMBER_BAPTISED.name()
                                        : ERole.MEMBER_UNBAPTISED.name()))
                .build();
        memberEventPublisher.publishMemberCreated(memberCreatedEvent);

        log.info("Saved Member with id: {}", member.getId());

        return MemberMapper.toResponse(savedMember);
    }

    @Override
    @Transactional
    public MemberResponse updateMember(Long id, UpdateMemberRequest memberRequest) {
        Member savedMember = findById(id, null);

        savedMember.setBaptised(memberRequest.getIsBaptised());
        savedMember.setGender(Gender.valueOf(memberRequest.getGender()));
        savedMember.setFirstName(memberRequest.getFirstName());
        savedMember.setLastName(memberRequest.getLastName());
        savedMember.setMiddleName(memberRequest.getMiddleName());
        savedMember.setAddress(memberRequest.getAddress());

        if (memberRequest.getChurchId() != null) {
            Church church = churchRepository.findById(memberRequest.getChurchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Church", memberRequest.getChurchId()));
            savedMember.setChurch(church);
        }

        if (Boolean.TRUE.equals(memberRequest.getIsBaptised())) {
            BaptismRecord baptismRecord = getBaptismRecord(memberRequest, savedMember.getBaptismRecord());
            savedMember.setBaptismRecord(baptismRecordService.update(baptismRecord.getId(), baptismRecord));
        }

        Member updatedMember = memberRepository.save(savedMember);

        return MemberMapper.toResponse(updatedMember);
    }

    @Override
    public Page<MemberResponse> getAllMembers(Pageable pageable) {
        log.info("Fetching all members based on: {}", pageable);

        Page<Member> members = memberRepository.findAll(pageable);

        return members.map(MemberMapper::toResponse);
    }

    @Override
    public Page<MemberResponse> getAllChurchMembers(Long churchId, Pageable pageable) {
        log.info("Fetching all members of a church with id: {}, page: {}", churchId, pageable);

        Page<Member> churchMembers = memberRepository.findAllByChurchId(churchId, pageable);

        return churchMembers.map(MemberMapper::toResponse);
    }

    @Override
    public MemberResponse getChurchMember(Long churchId, Long memberId) {
        log.info("Getting church member with id: {} from church with id: {}", memberId, churchId);

        Member member = findById(memberId, churchId);

        return MemberMapper.toResponse(member);
    }

    @Override
    public Page<MemberResponse> fetchProspectiveAdmins(Long churchId, Pageable pageable) {
        log.info("Fetching prospective admins for church id: {}", churchId);

        Page<Member> churchAdmins = this.memberRepository.findAllByChurchIdAndUserTypeChurchAdmin(churchId, pageable);

        return churchAdmins.map(MemberMapper::toResponse);
    }

    @Override
    public void processUserUpdatedEvent(UserUpdatedEvent userUpdatedEvent) {
        log.info("Updating the member based on user event");

        // 1. Fetch the member
        String exception = String.format("Member with id: %s not found!", userUpdatedEvent.getMemberId());
        Member member = this.memberRepository
                .findById(userUpdatedEvent.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException(exception));

        // 2. Update the member
        member.setUserId(userUpdatedEvent.getUserId());
        this.memberRepository.saveAndFlush(member);
    }

    @Override
    public Page<MemberResponse> searchMembers(String query, Pageable pageable) {
        Church church = securityUtils.getLoggedInUserChurch();

        // 3. Perform a simple search
        return memberRepository.findByChurchIdAndName(church.getId(), query, pageable)
                .map(MemberMapper::toResponse);
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

    private Member findById(Long id, Long churchId) throws IllegalArgumentException, ResourceNotFoundException {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Id is required!");
        }

        Member member = memberRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Member", id));

        if (churchId != null && churchId > 0 && !churchId.equals(member.getChurch().getId())) {
            throw new ResourceNotFoundException("Member", id);
        }

        return member;
    }

    @Override
    @Transactional
    public MemberResponse registerMember(String baptismalNumber, Boolean isBaptised, Long churchId) {
        // Validate baptismal number uniqueness against Member.tel
        if (baptismalNumber != null && !baptismalNumber.isEmpty() && memberRepository.existsByTel(baptismalNumber)) {
            log.error("Duplicate baptismal number: {}", baptismalNumber);
            throw new DuplicateResourceException("Baptismal number already exists: " + baptismalNumber);
        }

        // Create church lookup
        Church church = churchRepository.findById(churchId)
                .orElseThrow(() -> new ResourceNotFoundException("Church", churchId));

        // Create Member record
        Member member = Member.builder()
                .tel(baptismalNumber)
                .isBaptised(isBaptised)
                .church(church)
                .build();

        if (Boolean.TRUE.equals(isBaptised)) {
            BaptismRecord baptismRecord = BaptismRecord.builder()
                    .serialNumber(baptismalNumber != null ? Integer.parseInt(baptismalNumber) : 0)
                    .build();
            member.setBaptismRecord(baptismRecordService.save(baptismRecord));
        }

        Member savedMember = memberRepository.save(member);

        log.info("Registered Member with id: {}", savedMember.getId());
        return MemberMapper.toResponse(savedMember);
    }
}
