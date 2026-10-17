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
    private String name;
}
