package com.mikkytrionze.nkst.church.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class ChurchRequest {

    @NotBlank(message = "Church name is required!")
    private String name;

    @NotBlank(message = "Address is required!")
    private String address;

    private String emailAddress;

    private String telNumber;

    private Long parentChurchId;
}
