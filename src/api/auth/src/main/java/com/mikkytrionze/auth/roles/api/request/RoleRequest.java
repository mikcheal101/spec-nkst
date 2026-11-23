package com.mikkytrionze.auth.roles.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class RoleRequest {

    @NotEmpty(message = "Permissions cannot be null!")
    private List<@NotBlank(message = "Empty permission value!") String> permissions;

    // required for protected/governance-critical role changes (secondary Super Admin mutations)
    private String stepUpToken;
}
