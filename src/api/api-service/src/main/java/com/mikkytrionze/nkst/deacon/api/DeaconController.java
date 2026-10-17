package com.mikkytrionze.nkst.deacon.api;

import com.mikkytrionze.nkst.deacon.api.request.MakeDeaconRequest;
import com.mikkytrionze.nkst.deacon.domain.service.DeaconService;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
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
@RequestMapping("/api/v1/deacons")
public class DeaconController {

    private final DeaconService deaconService;

    @GetMapping
    @PreAuthorize("hasAuthority('can_view_deacons')")
    public ResponseEntity<Page<MemberResponse>> getDeacons(Pageable pageable) {
        log.info("Fetching paginated list of deacons with page number: {} and size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<MemberResponse> response = deaconService.fetchDeacons(pageable);

        log.info("Successfully retrieved {} deacons (Total elements: {})",
                response.getNumberOfElements(), response.getTotalElements());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('can_read_deacons')")
    public ResponseEntity<MemberResponse> getDeacon(@PathVariable("id") Long id) {
        log.info("Fetching details for deacon with ID: {}", id);

        MemberResponse response = deaconService.getDeacon(id);

        log.info("Successfully retrieved deacon with ID: {}", id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('can_create_deacons')")
    public ResponseEntity<Boolean> makeDeacon(@Valid @RequestBody MakeDeaconRequest makeDeaconRequest) {
        log.info("Processing request to promote member to deacon. Request details: {}", makeDeaconRequest);

        Boolean response = deaconService.createDeacon(makeDeaconRequest);

        log.info("Successfully processed deacon promotion request. Result: {}", response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('can_view_deacons')")
    public ResponseEntity<Page<MemberResponse>> search(
            @RequestParam("query") String query,
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        log.info("Searching for prospective deacons with query: '{}', page: {}, size: {}",
                query, pageable.getPageNumber(), pageable.getPageSize());

        Page<MemberResponse> response = deaconService.searchProspectiveDeacons(query, pageable);

        log.info("Search completed. Found {} matching prospective deacons (Total elements: {})",
                response.getNumberOfElements(), response.getTotalElements());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('can_update_deacons')")
    public ResponseEntity<MemberResponse> updateDeacon(@PathVariable("id") Long id,
                                                       @Valid @RequestBody UpdateMemberRequest memberRequest) {
        var response = deaconService.updateDeacon(id, memberRequest);
        return ResponseEntity.ok().body(response);
    }
}
