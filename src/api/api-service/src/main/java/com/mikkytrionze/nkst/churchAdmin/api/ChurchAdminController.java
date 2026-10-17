package com.mikkytrionze.nkst.churchAdmin.api;

import com.mikkytrionze.nkst.churchAdmin.domain.service.ChurchAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/church-admin")
public class ChurchAdminController {

    private final ChurchAdminService churchAdminService;

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('can_update_church')")
    public ResponseEntity<Boolean> makeChurchAdmin(@PathVariable Long id) {
        boolean response = this.churchAdminService.setChurchAdmin(id);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('can_view_church') and hasAuthority('can_read_church')")
    public ResponseEntity<Boolean> churchHasAdmin(@PathVariable Long id) {
        boolean hasAdmin = this.churchAdminService.churchHasAdmin(id);
        return ResponseEntity.ok().body(hasAdmin);
    }
}
