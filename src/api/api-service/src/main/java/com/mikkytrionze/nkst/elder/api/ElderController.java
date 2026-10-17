package com.mikkytrionze.nkst.elder.api;

import com.mikkytrionze.nkst.elder.api.request.MakeElderRequest;
import com.mikkytrionze.nkst.elder.domain.service.ElderService;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
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
@RequestMapping("/api/v1/elders")
public class ElderController {

    private final ElderService elderService;

    @GetMapping
    @PreAuthorize("hasAuthority('can_view_elders')")
    public ResponseEntity<Page<MemberResponse>> elders(Pageable pageable) {

        log.info("Fetching paginated list of elders with page number: {} and size: {}",
                pageable.getPageNumber(), pageable.getPageSize());
        Page<MemberResponse> response = this.elderService.getElders(pageable);

        log.info("Successfully retrieved {} elders (Total elements: {})",
                response.getNumberOfElements(), response.getTotalElements());
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('can_read_elders')")
    public ResponseEntity<MemberResponse> elder(@PathVariable("id") Long id) {

        log.info("Fetching details for elder with ID: {}", id);
        MemberResponse response = this.elderService.getElder(id);

        log.info("Successfully retrieved elder with ID: {}", id);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('can_create_elders') OR hasAuthority('can_update_elders')")
    public ResponseEntity<Boolean> makeAnElder(@Valid @RequestBody MakeElderRequest makeElderRequest) {

        log.info("Processing request to promote member to elder. Request details: {}", makeElderRequest);
        Boolean response = elderService.makeElder(makeElderRequest);

        log.info("Successfully processed elder promotion request. Result: {}", response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('can_view_elders')")
    public ResponseEntity<Page<MemberResponse>> search(
            @RequestParam(value = "query") String query,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {

        log.info("Searching for eligible members to be elders with query: '{}', page: {}, size: {}",
                query, pageable.getPageNumber(), pageable.getPageSize());
        Page<MemberResponse> results = elderService.searchEligibleMembersForElder(query, pageable);

        log.info("Search completed. Found {} matching eligible members (Total elements: {})",
                results.getNumberOfElements(), results.getTotalElements());
        return ResponseEntity.ok(results);
    }
}
