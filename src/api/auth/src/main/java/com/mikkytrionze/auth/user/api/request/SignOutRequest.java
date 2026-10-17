package com.mikkytrionze.auth.user.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class SignOutRequest {

    @NotBlank(message = "Access Token is required!")
    private String accessToken;

    @NotBlank(message = "Refresh Token is required!")
    private String refreshToken;
}
