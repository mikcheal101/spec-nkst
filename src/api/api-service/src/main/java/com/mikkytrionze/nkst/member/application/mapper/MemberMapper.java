package com.mikkytrionze.nkst.member.application.mapper;

import com.mikkytrionze.nkst.church.application.mapper.ChurchMapper;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.application.dto.MemberDTO;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.Member;

import java.util.Objects;

public class MemberMapper {
    public static MemberDTO toDTO(Member member) {
        if (member == null) {
            return null;
        }

        return MemberDTO.builder()
                .id(member.getId())
                .tel(member.getTel())
                .gender(member.getGender().name().toUpperCase())
                .isBaptised(member.isBaptised())
                .lastName(member.getLastName())
                .middleName(member.getMiddleName())
                .address(member.getAddress())
                .isAdmin(member.isAdmin())
                .firstName(member.getFirstName())
                .emailAddress(member.getEmailAddress())
                .baptismRecordDTO(BaptismRecordMapper.toDTO(member.getBaptismRecord()))
                .build();
    }

    public static MemberResponse toResponse(Member member) {
        if (member == null) {
            return null;
        }

        return MemberResponse.builder()
                .id(member.getId())
                .tel(member.getTel())
                .firstName(member.getFirstName())
                .middleName(member.getMiddleName())
                .lastName(member.getLastName())
                .gender(member.getGender().name().toUpperCase())
                .address(member.getAddress())
                .isAdmin(member.isAdmin())
                .emailAddress(member.getEmailAddress())
                .isBaptised(member.isBaptised())
                .church(ChurchMapper.toDTO(member.getChurch(), false))
                .baptismRecord(BaptismRecordMapper.toDTO(member.getBaptismRecord()))
                .build();
    }

    public static Member toEntity(MemberDTO memberDTO) {
        if (memberDTO == null) {
            return null;
        }

        Gender gender = Objects.isNull(memberDTO.getGender()) ? Gender.MALE : Gender.valueOf(memberDTO.getGender());
        return Member.builder()
                .tel(memberDTO.getTel())
                .gender(gender)
                .address(memberDTO.getAddress())
                .isAdmin(Boolean.TRUE.equals(memberDTO.getIsAdmin()))
                .isBaptised(Boolean.TRUE.equals(memberDTO.getIsBaptised()))
                .lastName(memberDTO.getLastName())
                .middleName(memberDTO.getMiddleName())
                .firstName(memberDTO.getFirstName())
                .emailAddress(memberDTO.getEmailAddress())
                .baptismRecord(BaptismRecordMapper.toEntity(memberDTO.getBaptismRecordDTO()))
                .build();
    }

    public static Member toEntity(MemberResponse memberResponse) {
        if (memberResponse == null) {
            return null;
        }

        Gender gender = Objects.isNull(memberResponse.getGender()) ? Gender.MALE : Gender.valueOf(memberResponse.getGender().toUpperCase());
        return Member.builder()
                .tel(memberResponse.getTel())
                .gender(gender)
                .address(memberResponse.getAddress())
                .isAdmin(memberResponse.isAdmin())
                .isBaptised(memberResponse.isBaptised())
                .lastName(memberResponse.getLastName())
                .middleName(memberResponse.getMiddleName())
                .firstName(memberResponse.getFirstName())
                .emailAddress(memberResponse.getEmailAddress())
                .baptismRecord(BaptismRecordMapper.toEntity(memberResponse.getBaptismRecord()))
                .build();
    }
}
