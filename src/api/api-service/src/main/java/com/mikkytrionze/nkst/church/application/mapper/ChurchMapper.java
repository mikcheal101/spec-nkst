package com.mikkytrionze.nkst.church.application.mapper;

import com.mikkytrionze.nkst.church.application.dto.ChurchDTO;
import com.mikkytrionze.nkst.church.api.response.ChurchResponse;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.pastor.application.dto.PastorDTO;
import com.mikkytrionze.nkst.pastor.application.mapper.PastorMapper;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;

import java.util.List;
import java.util.Objects;

public class ChurchMapper {

    public static ChurchDTO toDTO(Church church, boolean fetchChildren) {
        if (Objects.isNull(church)) {
            return null;
        }

        ChurchDTO parentChurch = ChurchMapper.toDTO(church.getParentChurch(), false);

        List<ChurchDTO> subChurches = fetchChildren ? church.getSubChurches().stream()
                .map(subChurch -> ChurchMapper.toDTO(subChurch, true))
                .toList() : List.of();

        List<PastorDTO> pastors = fetchChildren ? church.getPastors().stream()
                .map(pastor -> PastorMapper.toDTO(pastor))
                .toList() : List.of();

        return ChurchDTO.builder()
                .id(church.getId())
                .name(church.getName())
                .address(church.getAddress())
                .telNumber(church.getTelNumber())
                .emailAddress(church.getEmailAddress())
                .parentChurch(parentChurch)
                .pastors(pastors)
                .subChurches(subChurches)
                .build();
    }

    public static ChurchResponse toResponse(Church church) {
        if (Objects.isNull(church)) {
            return null;
        }

        ChurchDTO parentChurch = ChurchMapper.toDTO(church.getParentChurch(), false);

        List<PastorDTO> pastors = church.getPastors().stream()
                .map(pastor -> PastorMapper.toDTO(pastor))
                .toList();

        List<ChurchDTO> subChurches = church.getSubChurches().stream()
                .map(subChurch -> ChurchMapper.toDTO(subChurch, true))
                .toList();

        return ChurchResponse.builder()
                .id(church.getId())
                .name(church.getName())
                .address(church.getAddress())
                .telNumber(church.getTelNumber())
                .emailAddress(church.getEmailAddress())
                .parentChurch(parentChurch)
                .subChurches(subChurches)
                .pastors(pastors)
                .build();
    }

    public static Church toEntity(ChurchDTO churchDTO) {
        if (Objects.isNull(churchDTO)) {
            return null;
        }

        Church parentCHurch = ChurchMapper.toEntity(churchDTO.getParentChurch());

        List<Pastor> pastors = churchDTO.getPastors().stream()
                .map(pastor -> PastorMapper.toEntity(pastor))
                .toList();

        List<Church> subChurches = churchDTO.getSubChurches().stream()
                .map(subChurch -> ChurchMapper.toEntity(subChurch))
                .toList();

        return Church.builder()
                .parentChurch(parentCHurch)
                .name(churchDTO.getName())
                .address(churchDTO.getAddress())
                .telNumber(churchDTO.getTelNumber())
                .emailAddress(churchDTO.getEmailAddress())
                .pastors(pastors)
                .subChurches(subChurches)
                .build();
    }
}
