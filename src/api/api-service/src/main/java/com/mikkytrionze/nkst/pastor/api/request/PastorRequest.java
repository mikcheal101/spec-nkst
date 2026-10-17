package com.mikkytrionze.nkst.pastor.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class PastorRequest {

    @NotNull(message = "Church Id is required!")
    private Long churchId;

    @NotNull(message = "Pastor Role is required!")
    private Long pastorRoleId;

    @NotNull(message = "Member id is required!")
    private Long memberId;
}
