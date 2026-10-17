package com.mikkytrionze.nkst.pastor.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class PastorRoleResponse {
    private Long id;
    private String name;
}
