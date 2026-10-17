package com.mikkytrionze.nkst.pastor.api;

import com.mikkytrionze.nkst.pastor.api.response.PastorRoleResponse;
import com.mikkytrionze.nkst.pastor.domain.service.PastorRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/pastor-roles")
public class PastorRoleController {

    private final PastorRoleService pastorRoleService;

    @GetMapping
    @PreAuthorize("hasAuthority('can_view_pastor')")
    public ResponseEntity<Page<PastorRoleResponse>> getPastorRoles(Pageable pageable) {
        log.info("Fetching pastor roles: {}", pageable);

        Page<PastorRoleResponse> pastorRoles = this.pastorRoleService.getPastorRoles(pageable);

        return ResponseEntity.ok(pastorRoles);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('can_read_pastor')")
    public ResponseEntity<PastorRoleResponse> getPastorRole(@PathVariable("id") Long id) {
        log.info("Fetching pastor role with id: {}", id);

        PastorRoleResponse pastorRoleResponse = this.pastorRoleService.getPastorRole(id);

        return ResponseEntity.ok(pastorRoleResponse);
    }
}
