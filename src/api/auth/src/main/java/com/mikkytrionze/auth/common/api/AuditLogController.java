package com.mikkytrionze.auth.common.api;

import com.mikkytrionze.auth.common.domain.model.AuditLog;
import com.mikkytrionze.auth.common.domain.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {
    private final AuditLogRepository repo;
    private final com.mikkytrionze.auth.common.application.service.RateLimitService rateLimitService;

    @GetMapping
    @PreAuthorize("hasAuthority('SETTINGS:READ') or hasAuthority('can_read_settings') or hasAuthority('ROLES:READ') or hasAuthority('can_read_roles')")
    public Page<AuditLog> list(@RequestParam(required=false) String action,
                               @RequestParam(required=false) String actor,
                               @RequestParam(required=false) String correlationId,
                               Pageable pageable,
                               HttpServletResponse response, jakarta.servlet.http.HttpServletRequest request) {
        rateLimitService.check("audit:list:"+request.getRemoteAddr(), 60, 1);
        // simple in-memory filter over page content for now; repo can be extended with Specifications
        Page<AuditLog> page = repo.findAll(pageable);
        List<AuditLog> filtered = page.getContent().stream()
                .filter(a -> action == null || action.isBlank() || action.equalsIgnoreCase(a.getAction()))
                .filter(a -> actor == null || actor.isBlank() || actor.equalsIgnoreCase(a.getActorUsername()))
                .filter(a -> correlationId == null || correlationId.isBlank() || correlationId.equals(a.getCorrelationId()))
                .toList();
        String corr = response.getHeader("X-Correlation-ID");
        if (corr != null) response.setHeader("X-Correlation-ID", corr);
        return new PageImpl<>(filtered, pageable, filtered.size());
    }
}
