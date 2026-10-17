package com.mikkytrionze.nkst.pastor.domain.model;

import com.mikkytrionze.nkst.shared.domain.Auditable;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pastor_roles")
@SuperBuilder(toBuilder = true)
@SQLRestriction("deleted = false")
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class PastorRole extends Auditable {

    @Column(unique = true, nullable = false)
    private String name;

    @Builder.Default
    @OneToMany(mappedBy = "pastorRole", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pastor> pastors = new ArrayList<>();
}
