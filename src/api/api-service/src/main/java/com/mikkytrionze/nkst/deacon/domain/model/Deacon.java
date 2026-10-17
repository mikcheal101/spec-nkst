package com.mikkytrionze.nkst.deacon.domain.model;

import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.shared.domain.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Getter
@Setter
@Table(name = "deacons")
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
@SQLRestriction("deleted = false")
public class Deacon extends Auditable {

    @OneToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne
    @JoinColumn(name = "church_id", nullable = false)
    private Church church;
}
