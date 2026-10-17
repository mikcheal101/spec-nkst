package com.mikkytrionze.auth.roles.api.Response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class RolesResponse {
        private Long id;
        private String name;
        private List<PermissionResponse> permissions;
}
