package com.mikkytrionze.auth.common.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "system_configurations")
public class SystemConfiguration {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name="config_key", nullable=false, unique=true, length=128)
    private String configKey;
    @Column(name="config_value", nullable=false, length=1024)
    private String configValue;
    @Column(length=512)
    private String description;
    @Column(name="updated_by")
    private Long updatedBy;
    @Column(name="updated_at")
    private Instant updatedAt;
}
