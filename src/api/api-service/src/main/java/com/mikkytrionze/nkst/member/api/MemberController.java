package com.mikkytrionze.nkst.member.api;

import com.mikkytrionze.nkst.member.api.request.MemberRequest;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.domain.service.MemberService;
import com.mikkytrionze.nkst.shared.util.Constants;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('can_read_members')")
    public ResponseEntity<MemberResponse> getMember(@PathVariable("id") Long id) {
        log.info("Getting member by id: {}", id);

        MemberResponse memberResponse = memberService.getById(id);

        return ResponseEntity.ok(memberResponse);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('can_view_members')")
    public ResponseEntity<Page<MemberResponse>> getMembers(
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        log.info("Getting all the members by page: {}", pageable);

        Page<MemberResponse> page = memberService.getAllMembers(pageable);

        return ResponseEntity.ok(page);
    }

    @GetMapping("/church-members/{churchId}")
    @PreAuthorize("hasAuthority('can_view_members')")
    public ResponseEntity<Page<MemberResponse>> getChurchMembers(
            @PathVariable("churchId") Long churchId,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        log.info("Getting all the members of a church: {}", churchId);

        Page<MemberResponse> page = memberService.getAllChurchMembers(churchId, pageable);

        return ResponseEntity.ok(page);
    }

    @GetMapping("/church-members/{churchId}/{memberId}")
    @PreAuthorize("hasAuthority('can_read_members')")
    public ResponseEntity<MemberResponse> getChurchMember(@PathVariable("churchId") Long churchId, @PathVariable("memberId") Long memberId) {
        log.info("Getting church member: {} from church: {}", memberId, churchId);

        MemberResponse member = memberService.getChurchMember(churchId, memberId);

        return ResponseEntity.ok(member);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('can_create_members')")
    public ResponseEntity<MemberResponse> createMember(@Valid @RequestBody MemberRequest request) {
        log.info("Creating member: {}", request);
        MemberResponse response = memberService.saveMember(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('can_update_members')")
    public ResponseEntity<MemberResponse> updateMember(@PathVariable("id") Long id, @Valid @RequestBody UpdateMemberRequest request) {
        log.info("Updating member with id: {}", id);
        MemberResponse response = memberService.updateMember(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('can_delete_members')")
    public ResponseEntity<Void> deleteMember(@PathVariable("id") Long id) {
        log.info("Deleting member with id: {}", id);
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('can_view_members')")
    public ResponseEntity<Page<MemberResponse>> search(
            @RequestParam(value = "query") String query,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {

        log.info("Searching for members with query: {}", query);

        Page<MemberResponse> results = memberService.searchMembers(query, pageable);

        return ResponseEntity.ok(results);
    }
}
