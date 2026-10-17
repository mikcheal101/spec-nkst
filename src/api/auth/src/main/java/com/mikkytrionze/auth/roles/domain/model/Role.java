package com.mikkytrionze.auth.roles.domain.model;

import com.mikkytrionze.auth.common.domain.model.Auditable;
import com.mikkytrionze.role.application.dto.ERole;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "roles")
@SuperBuilder(toBuilder = true)
public class Role extends Auditable {

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, unique = true, length = 25)
    private ERole name = ERole.MEMBER_UNBAPTISED;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "role_permissions",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();
}
