package com.mikkytrionze.nkst.member.application.mapper;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.application.dto.BaptismRecordDTO;
import com.mikkytrionze.nkst.member.application.dto.MemberDTO;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import com.mikkytrionze.nkst.member.domain.model.Member;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class MemberMapperTest {

    @Test
    void shouldMapMemberToDTO() {
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .id(1L)
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Center")
                .build();

        Member member = Member.builder()
                .id(1L)
                .firstName("John")
                .middleName("Doe")
                .lastName("Smith")
                .emailAddress("john@example.com")
                .tel("1234567890")
                .gender(Gender.MALE)
                .isBaptised(true)
                .baptismRecord(baptismRecord)
                .build();

        MemberDTO dto = MemberMapper.toDTO(member);

        assertNotNull(dto);
        assertEquals(1L, dto.getId());
        assertEquals("John", dto.getFirstName());
        assertEquals("Doe", dto.getMiddleName());
        assertEquals("Smith", dto.getLastName());
        assertEquals("john@example.com", dto.getEmailAddress());
        assertEquals("1234567890", dto.getTel());
        assertEquals("MALE", dto.getGender());
        assertTrue(dto.getIsBaptised());
        assertNotNull(dto.getBaptismRecordDTO());
    }

    @Test
    void shouldMapMemberToResponse() {
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .id(1L)
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Center")
                .build();

        Member member = Member.builder()
                .id(1L)
                .firstName("John")
                .middleName("Doe")
                .lastName("Smith")
                .emailAddress("john@example.com")
                .tel("1234567890")
                .gender(Gender.MALE)
                .isBaptised(true)
                .baptismRecord(baptismRecord)
                .build();

        MemberResponse response = MemberMapper.toResponse(member);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getMiddleName());
        assertEquals("Smith", response.getLastName());
        assertEquals("john@example.com", response.getEmailAddress());
        assertEquals("1234567890", response.getTel());
        assertEquals("MALE", response.getGender());
        assertTrue(response.isBaptised());
        assertNotNull(response.getBaptismRecord());
    }

    @Test
    void shouldMapDTOToMember() {
        BaptismRecordDTO baptismRecordDTO = BaptismRecordDTO.builder()
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Center")
                .serialNumber(123)
                .build();

        MemberDTO dto = MemberDTO.builder()
                .firstName("John")
                .middleName("Doe")
                .lastName("Smith")
                .emailAddress("john@example.com")
                .tel("1234567890")
                .gender("MALE")
                .isBaptised(true)
                .baptismRecordDTO(baptismRecordDTO)
                .build();

        Member member = MemberMapper.toEntity(dto);

        assertNotNull(member);
        assertEquals("John", member.getFirstName());
        assertEquals("Doe", member.getMiddleName());
        assertEquals("Smith", member.getLastName());
        assertEquals("john@example.com", member.getEmailAddress());
        assertEquals("1234567890", member.getTel());
        assertEquals(Gender.MALE, member.getGender());
        assertTrue(member.isBaptised());
        assertNotNull(member.getBaptismRecord());
    }

    @Test
    void shouldMapResponseToMember() {
        BaptismRecordDTO baptismRecordDTO = BaptismRecordDTO.builder()
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Center")
                .serialNumber(456)
                .build();

        MemberResponse response = MemberResponse.builder()
                .id(1L)
                .firstName("John")
                .middleName("Doe")
                .lastName("Smith")
                .emailAddress("john@example.com")
                .tel("1234567890")
                .gender("MALE")
                .isBaptised(true)
                .baptismRecord(baptismRecordDTO)
                .build();

        Member member = MemberMapper.toEntity(response);

        assertNotNull(member);
        assertEquals("John", member.getFirstName());
        assertEquals("Doe", member.getMiddleName());
        assertEquals("Smith", member.getLastName());
        assertEquals("john@example.com", member.getEmailAddress());
        assertEquals("1234567890", member.getTel());
        assertEquals(Gender.MALE, member.getGender());
        assertTrue(member.isBaptised());
        assertNotNull(member.getBaptismRecord());
    }

    @Test
    void shouldDefaultToMaleIfGenderIsNullInDTO() {
        MemberDTO dto = MemberDTO.builder()
                .firstName("John")
                .build();

        Member member = MemberMapper.toEntity(dto);

        assertEquals(Gender.MALE, member.getGender());
    }

    @Test
    void shouldDefaultToMaleIfGenderIsNullInResponse() {
        MemberResponse response = MemberResponse.builder()
                .firstName("John")
                .build();

        Member member = MemberMapper.toEntity(response);

        assertEquals(Gender.MALE, member.getGender());
    }

    @Test
    void shouldReturnNullWhenInputIsNull() {
        assertNull(MemberMapper.toDTO(null));
        assertNull(MemberMapper.toResponse(null));
        assertNull(MemberMapper.toEntity((MemberDTO) null));
        assertNull(MemberMapper.toEntity((MemberResponse) null));
    }

    @Test
    void shouldInstantiateMapper() {
        assertNotNull(new MemberMapper());
    }
}
