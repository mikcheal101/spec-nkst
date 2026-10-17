package com.mikkytrionze.auth.user.api.request;

import com.mikkytrionze.auth.user.api.validation.PasswordsMatch;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@PasswordsMatch(field = "password", fieldMatch = "confirmPassword", message = "Passwords do not match!")
public class SignupRequest {

    @NotBlank(message = "Username is required!")
    private String username;

    @NotBlank(message = "Password is required!")
    private String password;

    @NotBlank(message = "Confirm password is required!")
    private String confirmPassword;
}
