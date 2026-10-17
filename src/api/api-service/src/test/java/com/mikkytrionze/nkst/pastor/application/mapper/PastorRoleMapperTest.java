package com.mikkytrionze.nkst.pastor.application.mapper;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.pastor.api.response.PastorRoleResponse;
import com.mikkytrionze.nkst.pastor.application.dto.PastorRoleDTO;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;
import org.junit.jupiter.api.Test;

class PastorRoleMapperTest {

    @Test
    void shouldMapPastorRoleToDTO() {
        PastorRole pastorRole = PastorRole.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();

        PastorRoleDTO dto = PastorRoleMapper.toDTO(pastorRole);

        assertNotNull(dto);
        assertEquals(1L, dto.getId());
        assertEquals("Lead Pastor", dto.getName());
    }

    @Test
    void shouldMapPastorRoleToResponse() {
        PastorRole pastorRole = PastorRole.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();

        PastorRoleResponse response = PastorRoleMapper.toResponse(pastorRole);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Lead Pastor", response.getName());
    }

    @Test
    void shouldMapDTOToEntity() {
        PastorRoleDTO dto = PastorRoleDTO.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();

        PastorRole entity = PastorRoleMapper.toEntity(dto);

        assertNotNull(entity);
        assertEquals(1L, entity.getId());
        assertEquals("Lead Pastor", entity.getName());
    }

    @Test
    void shouldReturnNullWhenPastorRoleIsNull() {
        assertNull(PastorRoleMapper.toDTO(null));
        assertNull(PastorRoleMapper.toResponse(null));
        assertNull(PastorRoleMapper.toEntity(null));
    }

    @Test
    void shouldInstantiateMapper() {
        assertNotNull(new PastorRoleMapper());
    }
}
