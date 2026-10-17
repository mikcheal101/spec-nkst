package com.mikkytrionze.nkst.church.domain.model;

import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.shared.domain.Auditable;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;
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
@Table(name = "churches")
@SuperBuilder(toBuilder = true)
@SQLRestriction("deleted = false")
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class Church extends Auditable {

    @EqualsAndHashCode.Include
    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String telNumber;

    private String emailAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church parentChurch;

    @Builder.Default
    @OneToMany(mappedBy = "parentChurch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Church> subChurches = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "church", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pastor> pastors = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "church", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Member> members = new ArrayList<>();

    public void addPastor(Pastor pastor) {
        pastors.add(pastor);
        pastor.setChurch(this);
    }

    public void removePastor(Pastor pastor) {
        pastors.remove(pastor);
        pastor.setChurch(null);
    }

    public void addSubChurch(Church church) {
        subChurches.add(church);
        church.setParentChurch(this);
    }

    public void removeSubChurch(Church church) {
        subChurches.remove(church);
        church.setParentChurch(null);
    }
}
