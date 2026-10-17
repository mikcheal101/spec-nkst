package com.mikkytrionze.nkst.pastor.application.mapper;

import com.mikkytrionze.nkst.church.application.mapper.ChurchMapper;
import com.mikkytrionze.nkst.member.application.mapper.MemberMapper;
import com.mikkytrionze.nkst.pastor.api.response.PastorResponse;
import com.mikkytrionze.nkst.pastor.application.dto.PastorDTO;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;

import java.util.Objects;

public class PastorMapper {
    public static PastorDTO toDTO(Pastor pastor) {
        if(Objects.isNull((pastor))) {
            return null;
        }

        return PastorDTO.builder()
                .id(pastor.getId())
                .memberDTO(MemberMapper.toDTO(pastor.getMember()))
                .churchDTO(ChurchMapper.toDTO(pastor.getChurch(), false))
                .pastorRoleDTO(PastorRoleMapper.toDTO(pastor.getPastorRole()))
                .build();

    }

    public static PastorResponse toResponse(Pastor pastor) {
        if (Objects.isNull(pastor)) {
            return null;
        }

        return PastorResponse.builder()
                .id(pastor.getId())
                .middleName(pastor.getMember().getMiddleName())
                .firstName(pastor.getMember().getFirstName())
                .lastName(pastor.getMember().getLastName())
                .emailAddress(pastor.getMember().getEmailAddress())
                .gender(pastor.getMember().getGender().name().toUpperCase())
                .pastorRole(PastorRoleMapper.toDTO(pastor.getPastorRole()))
                .church(ChurchMapper.toDTO(pastor.getChurch(), true))
                .build();
    }

    public static Pastor toEntity(PastorDTO pastorDTO) {
        if (Objects.isNull(pastorDTO)) {
            return null;
        }

        return Pastor.builder()
                .id(pastorDTO.getId())
                .pastorRole(PastorRoleMapper.toEntity(pastorDTO.getPastorRoleDTO()))
                .member(MemberMapper.toEntity(pastorDTO.getMemberDTO()))
                .church(ChurchMapper.toEntity(pastorDTO.getChurchDTO()))
                .build();
    }
}
