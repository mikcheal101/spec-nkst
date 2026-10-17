package com.mikkytrionze.nkst.pastor.application.dto;

import com.mikkytrionze.nkst.church.application.dto.ChurchDTO;
import com.mikkytrionze.nkst.member.application.dto.MemberDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class PastorDTO {
    private Long id;
    private MemberDTO memberDTO;
    private ChurchDTO churchDTO;
    private PastorRoleDTO pastorRoleDTO;
}
