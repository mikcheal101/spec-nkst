package com.mikkytrionze.nkst.pastor.api.response;

import com.mikkytrionze.nkst.church.application.dto.ChurchDTO;
import com.mikkytrionze.nkst.pastor.application.dto.PastorRoleDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class PastorResponse {
    private Long id;
    private String lastName;
    private String middleName;
    private String firstName;
    private String emailAddress;
    private String gender;
    private String tel;
    private PastorRoleDTO pastorRole;
    private ChurchDTO church;
}
