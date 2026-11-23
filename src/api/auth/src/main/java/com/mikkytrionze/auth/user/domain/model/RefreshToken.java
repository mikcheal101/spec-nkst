package com.mikkytrionze.auth.user.domain.model;

import com.mikkytrionze.auth.common.domain.model.Identity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
@Table(name = "refresh_tokens")
public class RefreshToken extends Identity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 500)
    private String token;

    @Column(name = "token_jti", unique = true, length = 255)
    private String tokenJti;

    @Column(name = "family_id", length = 255)
    private String familyId;

    @Column(name = "token_hash", length = 255)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiryDate;

    @Column(name = "issued_at")
    private Instant issuedAt;

    @Column(name = "rotated_at")
    private Instant rotatedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "replaced_by_jti", length = 255)
    private String replacedByJti;

    @Column(name = "revocation_reason", length = 64)
    private String revocationReason;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;
}
