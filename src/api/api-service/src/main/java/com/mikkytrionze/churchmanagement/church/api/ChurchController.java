package com.mikkytrionze.churchmanagement.church.api;

import com.mikkytrionze.churchmanagement.church.api.request.ChurchRequest;
import com.mikkytrionze.churchmanagement.church.api.response.ChurchResponse;
import com.mikkytrionze.churchmanagement.church.domain.service.ChurchService;
import com.mikkytrionze.churchmanagement.member.api.response.MemberResponse;
import com.mikkytrionze.churchmanagement.member.domain.service.MemberService;
import com.mikkytrionze.churchmanagement.shared.util.Constants;
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
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'VIEW')")
    public ResponseEntity<Page<ChurchResponse>> getChurches(
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        Page<ChurchResponse> churches = this.churchService.getChurches(pageable);
        return ResponseEntity.ok().body(churches);
    }

    @PostMapping
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'CREATE')")
    public ResponseEntity<ChurchResponse> createChurch(@RequestBody @Valid ChurchRequest churchRequest) {
        ChurchResponse churchResponse = this.churchService.createChurch(churchRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(churchResponse);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'UPDATE')")
    public ResponseEntity<ChurchResponse> updateChurch(
            @PathVariable("id") Long id,
            @RequestBody @Valid ChurchRequest churchRequest) {
        ChurchResponse churchResponse = this.churchService.updateChurch(id, churchRequest);
        return ResponseEntity.ok().body(churchResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'READ')")
    public ResponseEntity<ChurchResponse> getChurch(@PathVariable("id") Long id) {
        ChurchResponse churchResponse = this.churchService.getChurch(id);
        return ResponseEntity.ok().body(churchResponse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'DELETE')")
    public ResponseEntity<Void> deleteChurch(@PathVariable("id") Long id) {
        this.churchService.deleteChurch(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sub-churches/{id}")
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'VIEW')")
    public ResponseEntity<Page<ChurchResponse>> getSubChurches(
            @PathVariable("id") Long id,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        Page<ChurchResponse> subChurches = this.churchService.getSubChurches(id, pageable);
        return ResponseEntity.ok(subChurches);
    }

    @GetMapping("/church-admins/{churchId}")
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'UPDATE')")
    public ResponseEntity<Page<MemberResponse>> fetchChurchAdmins(
            @PathVariable("churchId") Long churchId,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        Page<MemberResponse> admins = this.memberService.fetchProspectiveAdmins(churchId, pageable);
        return ResponseEntity.ok().body(admins);
    }
}
