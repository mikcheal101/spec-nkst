package com.mikkytrionze.nkst.member.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class MemberDTO {
    private Long id;
    private String tel;
    private String lastName;
    private String middleName;
    private String firstName;
    private String gender;
    private String emailAddress;
    private String address;
    private Boolean isAdmin;

    @Builder.Default
    private Boolean isBaptised = Boolean.FALSE;
    private BaptismRecordDTO baptismRecordDTO;
}
