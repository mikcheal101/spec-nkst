package com.mikkytrionze.churchmanagement.profile.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
    @Size(max = 100, message = "First name must be at most 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required!")
    @Size(max = 100, message = "Last name must be at most 100 characters")
    private String lastName;

    @Size(max = 100, message = "Middle name must be at most 100 characters")
    private String middleName;

    @NotBlank(message = "Telephone number is required!")
    @Pattern(regexp = "^(?=.*(?:\\d.*){7,15})[+()\\-\\s\\d]{7,20}$", message = "Telephone number format is invalid")
    private String tel;

    @Email(message = "Invalid email format!")
    @Size(max = 255, message = "Email must be at most 255 characters")
    private String emailAddress;
}
