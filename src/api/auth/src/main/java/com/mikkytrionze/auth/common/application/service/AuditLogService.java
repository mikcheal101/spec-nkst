package com.mikkytrionze.auth.common.application.service;

import com.mikkytrionze.auth.common.domain.model.AuditLog;
import com.mikkytrionze.auth.common.domain.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String resourceType, String resourceId, String outcome, String reasonCode,
                       Long actorUserId, String actorUsername, String beforeJson, String afterJson, String ip, String ua) {
        String corr = MDC.get("correlationId");
        if (corr == null || corr.isBlank()) corr = UUID.randomUUID().toString();
        AuditLog log = AuditLog.builder()
                .id(UUID.randomUUID().toString())
                .occurredAt(Instant.now())
                .actorUserId(actorUserId)
                .actorUsername(actorUsername)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .outcome(outcome)
                .reasonCode(reasonCode)
                .correlationId(corr)
                .ipAddress(ip)
                .userAgent(ua == null ? null : ua.substring(0, Math.min(512, ua.length())))
                .beforeJson(beforeJson)
                .afterJson(afterJson)
                .build();
        repository.save(log);
    }
}
