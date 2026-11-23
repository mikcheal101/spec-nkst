package com.mikkytrionze.churchmanagement.shared.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {
    private final AuditLogRepository repo;
    @GetMapping
    @PreAuthorize("@perm.has(authentication,'SETTINGS','READ') or @perm.has(authentication,'ROLES','READ')")
    public Page<AuditLogEntity> list(@RequestParam(required=false) String action, Pageable pageable) {
        if (action != null && !action.isBlank()) return repo.findByActionContainingIgnoreCase(action, pageable);
        return repo.findAll(pageable);
    }
}
