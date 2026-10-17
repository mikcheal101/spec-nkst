package com.mikkytrionze.nkst.member.application.mapper;

import com.mikkytrionze.nkst.member.application.dto.BaptismRecordDTO;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;

import java.util.Objects;

public class BaptismRecordMapper {
    public static BaptismRecordDTO toDTO(BaptismRecord baptismRecord) {
        if (Objects.isNull(baptismRecord)) {
            return null;
        }

        return BaptismRecordDTO.builder()
                .id(baptismRecord.getId())
                .dateOfBaptism(baptismRecord.getDateOfBaptism())
                .baptizedBy(baptismRecord.getBaptizedBy())
                .bibleVerse(baptismRecord.getBibleVerse())
                .remark(baptismRecord.getRemark())
                .imageUri(baptismRecord.getImageUri())
                .serialNumber(baptismRecord.getSerialNumber())
                .worshipCenter(baptismRecord.getWorshipCenter())
                .build();
    }

    public static BaptismRecord toEntity(BaptismRecordDTO baptismRecordDTO) {
        if (Objects.isNull(baptismRecordDTO)) {
            return null;
        }

        return BaptismRecord.builder()
                .dateOfBaptism(baptismRecordDTO.getDateOfBaptism())
                .worshipCenter(baptismRecordDTO.getWorshipCenter())
                .baptizedBy(baptismRecordDTO.getBaptizedBy())
                .bibleVerse(baptismRecordDTO.getBibleVerse())
                .remark(baptismRecordDTO.getRemark())
                .imageUri(baptismRecordDTO.getImageUri())
                .serialNumber(baptismRecordDTO.getSerialNumber())
                .build();
    }
}
