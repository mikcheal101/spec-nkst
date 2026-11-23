package com.mikkytrionze.churchmanagement.pastor.api;

import com.mikkytrionze.churchmanagement.pastor.api.request.PastorRequest;
import com.mikkytrionze.churchmanagement.pastor.api.response.PastorResponse;
import com.mikkytrionze.churchmanagement.pastor.domain.service.PastorService;
import com.mikkytrionze.churchmanagement.shared.util.Constants;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/pastors")
public class PastorController {

    private final PastorService pastorService;

    @GetMapping
    @PreAuthorize("@perm.has(authentication, 'PASTOR', 'VIEW')")
    public ResponseEntity<Page<PastorResponse>> getPastors(
            @PageableDefault(size = Constants.PAGE_SIZE) Pageable pageable) {
        Page<PastorResponse> pastors = pastorService.getPastors(pageable);
        return ResponseEntity.ok(pastors);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'PASTOR', 'READ')")
    public ResponseEntity<PastorResponse> getPastor(@PathVariable("id") Long id) {
        PastorResponse pastorResponse = pastorService.getPastorById(id);
        return ResponseEntity.ok(pastorResponse);
    }

    @PostMapping
    @PreAuthorize("@perm.has(authentication, 'PASTOR', 'CREATE')")
    public ResponseEntity<PastorResponse> createPastor(@RequestBody @Valid PastorRequest pastorRequest) {
        PastorResponse pastorResponse = pastorService.createPastor(pastorRequest);
        return ResponseEntity.ok(pastorResponse);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'PASTOR', 'UPDATE')")
    public ResponseEntity<PastorResponse> updatePastor(
            @PathVariable("id") Long id,
            @RequestBody @Valid PastorRequest pastorRequest) {
        PastorResponse pastorResponse = pastorService.updatePastor(id, pastorRequest);
        return ResponseEntity.ok(pastorResponse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'PASTOR', 'DELETE')")
    public ResponseEntity<Void> deletePastor(@PathVariable("id") Long id) {
        this.pastorService.deletePastorById(id);
        return ResponseEntity.noContent().build();
    }
}
