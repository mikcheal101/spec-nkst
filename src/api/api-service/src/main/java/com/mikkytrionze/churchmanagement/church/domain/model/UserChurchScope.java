package com.mikkytrionze.churchmanagement.church.domain.model;

import com.mikkytrionze.churchmanagement.shared.domain.Identity;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "user_church_scopes", uniqueConstraints = @UniqueConstraint(name="uk_user_church_scope", columnNames={"user_id","church_id"}))
public class UserChurchScope extends Identity {
    @Column(name="user_id", nullable=false)
    private Long userId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="church_id", nullable=false)
    private Church church;
}
