package com.mikkytrionze.auth.common.api;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.domain.model.SystemConfiguration;
import com.mikkytrionze.auth.common.domain.repository.SystemConfigurationRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system-configurations")
@RequiredArgsConstructor
public class SystemConfigurationController {
    private final SystemConfigurationRepository repo;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final com.mikkytrionze.auth.common.application.service.RateLimitService rateLimitService;
    private final com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig rateLimitConfig;

    @GetMapping
    @PreAuthorize("hasAuthority('SETTINGS:READ') or hasAuthority('can_read_settings') or hasAuthority('SETTINGS:VIEW') or hasAuthority('can_view_settings')")
    public List<SystemConfiguration> list(jakarta.servlet.http.HttpServletRequest req) { rateLimitService.check("syscfg:list:"+req.getRemoteAddr(), 60, 1); return repo.findAll(); }

    @PutMapping("/{key}")
    @PreAuthorize("hasAuthority('SETTINGS:UPDATE') or hasAuthority('can_update_settings')")
    public ResponseEntity<SystemConfiguration> upsert(@PathVariable String key, @RequestBody Map<String,String> body, Authentication auth, jakarta.servlet.http.HttpServletRequest req) {
        rateLimitService.check("syscfg:upsert:"+req.getRemoteAddr(), rateLimitConfig.getStepupGovernanceMaxRequests(), rateLimitConfig.getStepupGovernanceWindowMinutes());
        String value = body.get("value");
        if (value == null || value.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "value is required");
        var actor = userRepository.findByUsername(auth.getName()).orElse(null);
        SystemConfiguration cfg = repo.findByConfigKey(key).orElse(SystemConfiguration.builder().configKey(key).build());
        String before = cfg.getConfigValue();
        cfg.setConfigValue(value);
        cfg.setDescription(body.getOrDefault("description", cfg.getDescription()));
        cfg.setUpdatedBy(actor != null ? actor.getId() : null);
        cfg.setUpdatedAt(Instant.now());
        cfg = repo.save(cfg);
        auditLogService.record("SYSTEM_CONFIG_UPSERT", "SYSTEM_CONFIGURATION", key, "SUCCESS", null, actor!=null?actor.getId():null, actor!=null?actor.getUsername():null, before, value, null, null);
        return ResponseEntity.ok(cfg);
    }
}
