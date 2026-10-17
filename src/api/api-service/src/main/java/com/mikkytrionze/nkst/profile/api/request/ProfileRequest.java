package com.mikkytrionze.nkst.profile.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class ProfileRequest {
    @NotBlank(message = "First name is required!")
    private String firstName;

    @NotBlank(message = "Last name is required!")
    private String lastName;

    private String middleName;

    @NotBlank(message = "Telephone number is required!")
    private String tel;

    @Email(message = "Invalid email format!")
    private String emailAddress;
}
