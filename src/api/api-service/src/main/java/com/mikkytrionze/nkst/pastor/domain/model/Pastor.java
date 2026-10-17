package com.mikkytrionze.nkst.pastor.domain.model;

import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.shared.domain.Auditable;
import com.mikkytrionze.nkst.church.domain.model.Church;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pastors")
@SuperBuilder(toBuilder = true)
@SQLRestriction("deleted = false")
public class Pastor extends Auditable {

    @OneToOne
    @JoinColumn(name = "member_id", referencedColumnName = "id", unique = true)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pastor_role_id", nullable = false)
    private PastorRole pastorRole;
}
