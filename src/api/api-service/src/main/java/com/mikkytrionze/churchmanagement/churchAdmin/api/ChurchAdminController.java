package com.mikkytrionze.churchmanagement.churchAdmin.api;

import com.mikkytrionze.churchmanagement.churchAdmin.domain.service.ChurchAdminService;
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
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'UPDATE')")
    public ResponseEntity<Boolean> makeChurchAdmin(@PathVariable Long id) {
        boolean response = this.churchAdminService.setChurchAdmin(id);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'CHURCH', 'VIEW') and @perm.has(authentication, 'CHURCH', 'READ')")
    public ResponseEntity<Boolean> churchHasAdmin(@PathVariable Long id) {
        boolean hasAdmin = this.churchAdminService.churchHasAdmin(id);
        return ResponseEntity.ok().body(hasAdmin);
    }
}
