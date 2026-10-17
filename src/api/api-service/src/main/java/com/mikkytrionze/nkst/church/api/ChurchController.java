package com.mikkytrionze.nkst.church.api;

import com.mikkytrionze.nkst.church.api.request.ChurchRequest;
import com.mikkytrionze.nkst.church.api.response.ChurchResponse;
import com.mikkytrionze.nkst.church.domain.service.ChurchService;
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
@RequiredArgsConstructor
@RequestMapping("/api/v1/churches")
public class ChurchController {

    private final ChurchService churchService;
    private final MemberService memberService;

    @GetMapping
    @PreAuthorize("hasAuthority('can_view_church')")
    public ResponseEntity<Page<ChurchResponse>> getChurches(
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        Page<ChurchResponse> churches = this.churchService.getChurches(pageable);
        return ResponseEntity.ok().body(churches);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('can_create_church')")
    public ResponseEntity<ChurchResponse> createChurch(@RequestBody @Valid ChurchRequest churchRequest) {
        ChurchResponse churchResponse = this.churchService.createChurch(churchRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(churchResponse);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('can_update_church')")
    public ResponseEntity<ChurchResponse> updateChurch(
            @PathVariable("id") Long id,
            @RequestBody @Valid ChurchRequest churchRequest) {
        ChurchResponse churchResponse = this.churchService.updateChurch(id, churchRequest);
        return ResponseEntity.ok().body(churchResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('can_read_church')")
    public ResponseEntity<ChurchResponse> getChurch(@PathVariable("id") Long id) {
        ChurchResponse churchResponse = this.churchService.getChurch(id);
        return ResponseEntity.ok().body(churchResponse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('can_delete_church')")
    public ResponseEntity<Void> deleteChurch(@PathVariable("id") Long id) {
        this.churchService.deleteChurch(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sub-churches/{id}")
    @PreAuthorize("hasAuthority('can_view_church')")
    public ResponseEntity<Page<ChurchResponse>> getSubChurches(
            @PathVariable("id") Long id,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        Page<ChurchResponse> subChurches = this.churchService.getSubChurches(id, pageable);
        return ResponseEntity.ok(subChurches);
    }

    @GetMapping("/church-admins/{churchId}")
    @PreAuthorize("hasAuthority('can_update_church')")
    public ResponseEntity<Page<MemberResponse>> fetchChurchAdmins(
            @PathVariable("churchId") Long churchId,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        Page<MemberResponse> admins = this.memberService.fetchProspectiveAdmins(churchId, pageable);
        return ResponseEntity.ok().body(admins);
    }
}
