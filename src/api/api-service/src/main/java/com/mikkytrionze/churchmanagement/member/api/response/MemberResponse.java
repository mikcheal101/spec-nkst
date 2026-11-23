package com.mikkytrionze.churchmanagement.member.api.response;

import com.mikkytrionze.churchmanagement.church.application.dto.ChurchDTO;
import com.mikkytrionze.churchmanagement.member.application.dto.BaptismRecordDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class MemberResponse {
    private Long id;
    private String tel;
    private String firstName;
    private String middleName;
    private String lastName;
    private String gender;
    private String emailAddress;
    private boolean isBaptised;
    private ChurchDTO church;
    private boolean isAdmin;
    private String address;
    private BaptismRecordDTO baptismRecord;
}
