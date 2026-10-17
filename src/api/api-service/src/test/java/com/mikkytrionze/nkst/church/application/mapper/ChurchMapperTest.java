package com.mikkytrionze.nkst.church.application.mapper;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.church.application.dto.ChurchDTO;
import com.mikkytrionze.nkst.church.api.response.ChurchResponse;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.member.application.dto.MemberDTO;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.pastor.application.dto.PastorDTO;
import com.mikkytrionze.nkst.pastor.application.dto.PastorRoleDTO;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;

import java.util.List;

import org.junit.jupiter.api.Test;

class ChurchMapperTest {

    
    @Test
    void shouldMapChurchToDTO() {
        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .build();

        ChurchDTO dto = ChurchMapper.toDTO(church, true);

        assertNotNull(dto);
        assertEquals(1L, dto.getId());
        assertEquals("Main Church", dto.getName());
        assertEquals("123 Main St", dto.getAddress());
    }

    @Test
    void shouldMapChurchToResponse() {
        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .build();

        ChurchResponse response = ChurchMapper.toResponse(church);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Main Church", response.getName());
        assertEquals("123 Main St", response.getAddress());
    }

    @Test
    void shouldMapDTOToEntityWithIgnoredId() {
        ChurchDTO dto = ChurchDTO.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .build();

        Church church = ChurchMapper.toEntity(dto);

        assertNotNull(church);
        assertNull(church.getId());
        assertEquals("Main Church", church.getName());
        assertEquals("123 Main St", church.getAddress());
    }

    @Test
    void shouldReturnNullWhenChurchIsNull() {
        assertNull(ChurchMapper.toDTO(null, false));
        assertNull(ChurchMapper.toResponse(null));
        assertNull(ChurchMapper.toEntity(null));
    }

    @Test
    void shouldMapChurchWithParentAndPastors() {
        Church parent = Church.builder()
                .id(2L)
                .name("Parent Church")
                .build();

        PastorRole pastorRole = PastorRole.builder().name("Lead Pastor").build();

        Member member = Member.builder()
                .firstName("John")
                .lastName("Doe")
                .build();

        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(member)
                .pastorRole(pastorRole)
                .build();

        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .parentChurch(parent)
                .pastors(List.of(pastor))
                .build();

        ChurchDTO dto = ChurchMapper.toDTO(church, true);
        assertNotNull(dto);
        assertNotNull(dto.getParentChurch());
        assertEquals("Parent Church", dto.getParentChurch().getName());
        assertNotNull(dto.getPastors());
        assertEquals(1, dto.getPastors().size());

        ChurchResponse response = ChurchMapper.toResponse(church);
        assertNotNull(response);
        assertNotNull(response.getParentChurch());
        assertNotNull(response.getPastors());
    }

    @Test
    void shouldMapDTOToEntityWithNestedObjects() {
        MemberDTO memberDTO = MemberDTO.builder()
                .firstName("John")
                .lastName("Doe")
                .build();

        PastorDTO pastorDTO = PastorDTO.builder()
                .id(1L)
                .memberDTO(memberDTO)
                .pastorRoleDTO(PastorRoleDTO.builder().name("Lead Pastor").build())
                .build();

        ChurchDTO parentDTO = ChurchDTO.builder()
                .id(2L)
                .name("Parent Church")
                .build();

        ChurchDTO churchDTO = ChurchDTO.builder()
                .id(1L)
                .name("Main Church")
                .address("123 Main St")
                .parentChurch(parentDTO)
                .pastors(List.of(pastorDTO))
                .build();

        Church church = ChurchMapper.toEntity(churchDTO);

        assertNotNull(church);
        assertNull(church.getId());
        assertEquals("Main Church", church.getName());
        assertNotNull(church.getParentChurch());
        assertNull(church.getParentChurch().getId());
        assertFalse(church.getPastors().isEmpty());
    }

    @Test
    void shouldMapEmptyPastorsSet() {
        Church church = Church.builder()
                .id(1L)
                .name("Church")
                .pastors(List.of())
                .build();

        ChurchDTO dto = ChurchMapper.toDTO(church, true);
        assertNotNull(dto.getPastors());
        assertTrue(dto.getPastors().isEmpty());
    }

    @Test
    void shouldMapPastorWithNullRole() {
        Member member = Member.builder()
                .firstName("John")
                .lastName("Doe")
                .tel("123")
                .build();
        Pastor pastor = new Pastor();
        pastor.setId(1L);
        pastor.setMember(member);
        pastor.setPastorRole(null);

        Church church = Church.builder()
                .id(1L)
                .name("Church")
                .pastors(List.of(pastor))
                .build();

        ChurchDTO dto = ChurchMapper.toDTO(church, true);
        assertNotNull(dto.getPastors());
        assertEquals(1, dto.getPastors().size());
        assertNull(dto.getPastors().stream().toList().getFirst().getPastorRoleDTO());
    }

    @Test
    void shouldMapPastorDTOWithNullRoleToEntity() {
        MemberDTO memberDTO = MemberDTO.builder()
                .firstName("John")
                .lastName("Doe")
                .build();

        PastorDTO pastorDTO = PastorDTO.builder()
                .id(1L)
                .memberDTO(memberDTO)
                .build();

        ChurchDTO churchDTO = ChurchDTO.builder()
                .id(1L)
                .name("Church")
                .pastors(List.of(pastorDTO))
                .build();

        Church church = ChurchMapper.toEntity(churchDTO);
        assertNotNull(church);
        assertFalse(church.getPastors().isEmpty());
        assertNull(church.getPastors().iterator().next().getPastorRole());
    }

    @Test
    void shouldHandleNullPastorsSet() {
        Church church = Church.builder()
                        .id(1L)
                        .name("Church")
                        .build();

        ChurchDTO dto = ChurchMapper.toDTO(church, true);
        assertNotNull(dto);
        assertTrue(dto.getPastors().isEmpty());
    }

    @Test
    void shouldHandleNullPastorsListInDTO() {
        ChurchDTO churchDTO = ChurchDTO.builder()
                .id(1L)
                .name("Church")
                .build();

        Church church = ChurchMapper.toEntity(churchDTO);
        assertNotNull(church);
        assertTrue(church.getPastors() == null || church.getPastors().isEmpty());
    }

    @Test
    void shouldInstantiateMapper() {
        assertNotNull(new ChurchMapper());
    }

    @Test
    void shouldSkipChildrenWhenFetchChildrenIsFalse() {
        PastorRole pastorRole = PastorRole.builder().name("Lead Pastor").build();
        Member member = Member.builder()
                .firstName("John")
                .lastName("Doe")
                .tel("123")
                .build();
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(member)
                .pastorRole(pastorRole)
                .build();

        Church child = Church.builder()
                .id(2L)
                .name("Child Church")
                .build();

        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .subChurches(List.of(child))
                .pastors(List.of(pastor))
                .build();

        ChurchDTO dto = ChurchMapper.toDTO(church, false);

        assertNotNull(dto);
        assertTrue(dto.getSubChurches().isEmpty());
        assertTrue(dto.getPastors().isEmpty());
    }

    @Test
    void shouldMapChurchToDTOWithSubChurches() {
        Church child = Church.builder()
                .id(2L)
                .name("Child Church")
                .build();

        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .subChurches(List.of(child))
                .build();

        ChurchDTO dto = ChurchMapper.toDTO(church, true);

        assertNotNull(dto);
        assertEquals(1, dto.getSubChurches().size());
        assertEquals("Child Church", dto.getSubChurches().getFirst().getName());
    }

    @Test
    void shouldMapChurchToResponseWithSubChurches() {
        Church child = Church.builder()
                .id(2L)
                .name("Child Church")
                .build();

        Church church = Church.builder()
                .id(1L)
                .name("Main Church")
                .subChurches(List.of(child))
                .build();

        ChurchResponse response = ChurchMapper.toResponse(church);

        assertNotNull(response);
        assertEquals(1, response.getSubChurches().size());
        assertEquals("Child Church", response.getSubChurches().getFirst().getName());
    }

    @Test
    void shouldMapDTOToEntityWithSubChurches() {
        ChurchDTO childDTO = ChurchDTO.builder()
                .id(2L)
                .name("Child Church")
                .build();

        ChurchDTO churchDTO = ChurchDTO.builder()
                .id(1L)
                .name("Main Church")
                .subChurches(List.of(childDTO))
                .build();

        Church church = ChurchMapper.toEntity(churchDTO);

        assertNotNull(church);
        assertEquals(1, church.getSubChurches().size());
        assertEquals("Child Church", church.getSubChurches().getFirst().getName());
    }
}
