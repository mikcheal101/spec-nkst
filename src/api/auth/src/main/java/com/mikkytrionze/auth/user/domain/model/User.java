package com.mikkytrionze.auth.user.domain.model;

import com.mikkytrionze.auth.common.domain.model.Identity;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
@SuperBuilder(toBuilder = true)
@EqualsAndHashCode(callSuper = true)
public class User extends Identity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 32)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Builder.Default
    @Column(name = "is_root_super_admin", nullable = false)
    private boolean rootSuperAdmin = false;

    @Builder.Default
    @Column(name = "permission_epoch", nullable = false)
    private long permissionEpoch = 0L;

    @Column(name = "last_security_change_at")
    private Instant lastSecurityChangeAt;

    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_permissions",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();
}
