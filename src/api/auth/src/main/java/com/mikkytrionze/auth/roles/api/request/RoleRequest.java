package com.mikkytrionze.auth.roles.api.request;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class RoleRequest {
    @NonNull
    private String name;

    @Builder.Default
    private List<String> permissions = new ArrayList<>();
}
