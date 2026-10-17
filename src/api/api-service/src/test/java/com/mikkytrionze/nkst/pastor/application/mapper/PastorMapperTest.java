package com.mikkytrionze.nkst.pastor.application.mapper;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.church.application.dto.ChurchDTO;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.member.application.dto.MemberDTO;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.pastor.api.response.PastorResponse;
import com.mikkytrionze.nkst.pastor.application.dto.PastorDTO;
import com.mikkytrionze.nkst.pastor.application.dto.PastorRoleDTO;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;

import java.util.List;
import org.junit.jupiter.api.Test;

class PastorMapperTest {

    @Test
    void shouldMapPastorToDTO() {
        PastorRole pastorRole = PastorRole.builder().name("Lead Pastor").build();
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .middleName("M")
                        .emailAddress("john@test.com")
                        .build())
                .pastorRole(pastorRole)
                .build();

        PastorDTO dto = PastorMapper.toDTO(pastor);

        assertNotNull(dto);
        assertEquals(1L, dto.getId());
        assertEquals("John", dto.getMemberDTO().getFirstName());
        assertEquals("Doe", dto.getMemberDTO().getLastName());
        assertEquals("M", dto.getMemberDTO().getMiddleName());
        assertEquals("john@test.com", dto.getMemberDTO().getEmailAddress());
    }

    @Test
    void shouldMapPastorToDTOWithNullRole() {
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .tel("123")
                        .build())
                .pastorRole(null)
                .build();

        PastorDTO dto = PastorMapper.toDTO(pastor);
        assertNotNull(dto);
        assertNull(dto.getPastorRoleDTO());
    }

    @Test
    void shouldMapPastorToResponse() {
        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .build();

        PastorRole pastorRole = PastorRole.builder().name("Lead Pastor").build();
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .emailAddress("john@test.com")
                        .build())
                .pastorRole(pastorRole)
                .church(church)
                .build();

        PastorResponse response = PastorMapper.toResponse(pastor);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        assertNotNull(response.getChurch());
        assertEquals("Main Church", response.getChurch().getName());

        ChurchDTO churchDto = response.getChurch();
        assertNotNull(churchDto.getPastors());
        assertTrue(churchDto.getPastors().isEmpty());
    }

    @Test
    void shouldMapPastorToResponseWithNullRole() {
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .tel("123")
                        .build())
                .pastorRole(null)
                .build();

        PastorResponse response = PastorMapper.toResponse(pastor);
        assertNotNull(response);
        assertNull(response.getPastorRole());
    }

    @Test
    void shouldMapPastorToResponseWithChurchAndPastors() {
        PastorRole childRole = PastorRole.builder().name("Associate Pastor").build();
        Pastor childPastor = new Pastor();
        childPastor.setId(2L);
        childPastor.setMember(Member.builder()
                .firstName("Jane")
                .lastName("Smith")
                .tel("456")
                .build());
        childPastor.setPastorRole(childRole);

        PastorRole leadRole = PastorRole.builder().name("Lead Pastor").build();
        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .pastors(List.of(childPastor))
                .build();

        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .build())
                .pastorRole(leadRole)
                .church(church)
                .build();

        PastorResponse response = PastorMapper.toResponse(pastor);
        assertNotNull(response.getChurch());
        assertNotNull(response.getChurch().getPastors());
        assertEquals(1, response.getChurch().getPastors().size());
    }

    @Test
    void shouldMapPastorToResponseWithChurchHavingNullPastors() {
        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .build();

        PastorRole leadRole = PastorRole.builder().name("Lead Pastor").build();
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .build())
                .pastorRole(leadRole)
                .church(church)
                .build();

        PastorResponse response = PastorMapper.toResponse(pastor);
        assertNotNull(response.getChurch());
        assertTrue(response.getChurch().getPastors().isEmpty());
    }

    @Test
    void shouldMapDTOToEntityWithIgnoredId() {
        PastorDTO dto = PastorDTO.builder()
                .id(1L)
                .memberDTO(MemberDTO.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .build())
                .pastorRoleDTO(PastorRoleDTO.builder().name("Lead Pastor").build())
                .build();

        Pastor pastor = PastorMapper.toEntity(dto);

        assertNotNull(pastor);
        assertNotNull(pastor.getId());
        assertEquals("John", pastor.getMember().getFirstName());
        assertEquals("Doe", pastor.getMember().getLastName());
        assertNotNull(pastor.getPastorRole());
    }

    @Test
    void shouldReturnNullWhenPastorIsNull() {
        assertNull(PastorMapper.toDTO(null));
        assertNull(PastorMapper.toResponse(null));
        assertNull(PastorMapper.toEntity(null));
    }

    @Test
    void shouldHandleNullChurchInPastor() {
        PastorRole leadRole = PastorRole.builder().name("Lead Pastor").build();
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .build())
                .pastorRole(leadRole)
                .build();

        PastorResponse response = PastorMapper.toResponse(pastor);
        assertNull(response.getChurch());
    }

    @Test
    void shouldInstantiateMapper() {
        assertNotNull(new PastorMapper());
    }
}
