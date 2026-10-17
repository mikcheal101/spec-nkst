package com.mikkytrionze.nkst.elder.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class MakeElderRequest {
    @NotNull(message = "Member id is required!")
    private Long memberId;
}
