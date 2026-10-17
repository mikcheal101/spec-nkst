package com.mikkytrionze.nkst.pastor.application.mapper;

import com.mikkytrionze.nkst.pastor.api.response.PastorRoleResponse;
import com.mikkytrionze.nkst.pastor.application.dto.PastorRoleDTO;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;

import java.util.Objects;

public class PastorRoleMapper {
    public static PastorRoleDTO toDTO(PastorRole pastorRole) {
        if (Objects.isNull(pastorRole)) {
            return null;
        }

        return PastorRoleDTO.builder()
                .id(pastorRole.getId())
                .name(pastorRole.getName())
                .build();
    }

    public static PastorRoleResponse toResponse(PastorRole pastorRole) {
        if (Objects.isNull(pastorRole)) {
            return null;
        }

        return PastorRoleResponse.builder()
                .id(pastorRole.getId())
                .name(pastorRole.getName())
                .build();
    }

    public static PastorRole toEntity(PastorRoleDTO pastorRoleDTO) {
        if (Objects.isNull(pastorRoleDTO)) {
            return null;
        }

        return PastorRole.builder()
                .id(pastorRoleDTO.getId())
                .name(pastorRoleDTO.getName())
                .build();
    }
}
