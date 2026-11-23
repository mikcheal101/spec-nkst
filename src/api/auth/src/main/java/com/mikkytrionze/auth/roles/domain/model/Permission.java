package com.mikkytrionze.auth.roles.domain.model;

import com.mikkytrionze.auth.common.domain.model.Auditable;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
@Table(name = "permissions")
public class Permission extends Auditable {

    @Column(name = "name", unique = true, nullable = false, length = 50)
    private String name; // legacy alias

    @Column(name = "key_name", unique = true, length = 100)
    private String key;

    @Column(name = "resource", length = 50)
    private String resource;

    @Column(name = "action", length = 20)
    private String action;

    @Column(name = "legacy_alias", unique = true, length = 100)
    private String legacyAlias;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;
}
