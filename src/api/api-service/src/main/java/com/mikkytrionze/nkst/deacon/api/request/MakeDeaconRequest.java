package com.mikkytrionze.nkst.deacon.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class MakeDeaconRequest {
    @NotNull(message = "Member Id is required!")
    private Long memberId;
}
