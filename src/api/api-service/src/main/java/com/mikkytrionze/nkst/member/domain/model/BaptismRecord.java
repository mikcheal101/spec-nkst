package com.mikkytrionze.nkst.member.domain.model;

import com.mikkytrionze.nkst.shared.domain.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "baptism_record")
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
@SQLRestriction("deleted = false")
public class BaptismRecord extends Auditable {

    @Column(nullable = false)
    private int serialNumber;

    @Column(nullable = false)
    private LocalDate dateOfBaptism;

    @Column(nullable = false)
    private String worshipCenter; // the church name where the member was baptized at

    @Column(nullable = false)
    private String bibleVerse;

    @Column(nullable = false)
    private String baptizedBy; // pastor who baptized the member.

    private String remark;

    private String imageUri; // uri to passport photo.
}
