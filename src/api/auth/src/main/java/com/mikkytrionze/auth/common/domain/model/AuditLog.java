package com.mikkytrionze.auth.common.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "audit_log")
public class AuditLog {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;
    @Column(name = "actor_user_id")
    private Long actorUserId;
    @Column(name = "actor_username")
    private String actorUsername;
    @Column(nullable = false, length = 128)
    private String action;
    @Column(name = "resource_type", nullable = false, length = 128)
    private String resourceType;
    @Column(name = "resource_id", length = 128)
    private String resourceId;
    @Column(nullable = false, length = 32)
    private String outcome;
    @Column(name = "reason_code", length = 128)
    private String reasonCode;
    @Column(name = "correlation_id", nullable = false, length = 128)
    private String correlationId;
    @Column(name = "ip_address", length = 64)
    private String ipAddress;
    @Column(name = "user_agent", length = 512)
    private String userAgent;
    @Column(name = "before_json", columnDefinition = "TEXT")
    private String beforeJson;
    @Column(name = "after_json", columnDefinition = "TEXT")
    private String afterJson;
}
