package com.mikkytrionze.nkst.member.application.mapper;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.member.application.dto.BaptismRecordDTO;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class BaptismRecordMapperTest {

    @Test
    void shouldMapBaptismRecordToDTO() {
        LocalDate now = LocalDate.now();
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .id(1L)
                .dateOfBaptism(now)
                .baptizedBy("Pastor John")
                .bibleVerse("John 3:16")
                .remark("Amazing")
                .imageUri("http://example.com/image.jpg")
                .serialNumber(123)
                .worshipCenter("Main Center")
                .build();

        BaptismRecordDTO dto = BaptismRecordMapper.toDTO(baptismRecord);

        assertNotNull(dto);
        assertEquals(1L, dto.getId());
        assertEquals(now, dto.getDateOfBaptism());
        assertEquals("Pastor John", dto.getBaptizedBy());
        assertEquals("John 3:16", dto.getBibleVerse());
        assertEquals("Amazing", dto.getRemark());
        assertEquals("http://example.com/image.jpg", dto.getImageUri());
        assertEquals(123, dto.getSerialNumber());
        assertEquals("Main Center", dto.getWorshipCenter());
    }

    @Test
    void shouldMapDTOToBaptismRecord() {
        LocalDate now = LocalDate.now();
        BaptismRecordDTO dto = BaptismRecordDTO.builder()
                .address("123 Main St")
                .dateOfBaptism(now)
                .baptizedBy("Pastor John")
                .bibleVerse("John 3:16")
                .remark("Amazing")
                .imageUri("http://example.com/image.jpg")
                .serialNumber(123)
                .worshipCenter("Main Center")
                .build();

        BaptismRecord entity = BaptismRecordMapper.toEntity(dto);

        assertNotNull(entity);
        assertEquals(now, entity.getDateOfBaptism());
        assertEquals("Pastor John", entity.getBaptizedBy());
        assertEquals("John 3:16", entity.getBibleVerse());
        assertEquals("Amazing", entity.getRemark());
        assertEquals("http://example.com/image.jpg", entity.getImageUri());
        assertEquals(123, entity.getSerialNumber());
        assertEquals("Main Center", entity.getWorshipCenter());
    }

    @Test
    void shouldReturnNullWhenInputIsNull() {
        assertNull(BaptismRecordMapper.toDTO(null));
        assertNull(BaptismRecordMapper.toEntity(null));
    }

    @Test
    void shouldInstantiateMapper() {
        assertNotNull(new BaptismRecordMapper());
    }
}
