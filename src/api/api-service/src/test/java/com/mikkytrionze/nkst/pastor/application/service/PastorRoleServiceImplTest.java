package com.mikkytrionze.nkst.pastor.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.nkst.pastor.api.response.PastorRoleResponse;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;
import com.mikkytrionze.nkst.pastor.domain.repository.PastorRoleRepository;
import java.util.List;
import java.util.Optional;

import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class PastorRoleServiceImplTest {

    @Mock
    private PastorRoleRepository pastorRoleRepository;

    @InjectMocks
    private PastorRoleServiceImpl pastorRoleService;

    @Test
    void shouldGetAllPastorRoles() {
        PastorRole pastorRole = PastorRole.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        Page<PastorRole> pastorRolePage = new PageImpl<>(List.of(pastorRole));

        when(pastorRoleRepository.findAll(pageable)).thenReturn(pastorRolePage);

        Page<PastorRoleResponse> result = pastorRoleService.getPastorRoles(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void shouldGetPastorRoleById() {
        PastorRole pastorRole = PastorRole.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();

        when(pastorRoleRepository.findById(1L)).thenReturn(Optional.of(pastorRole));

        PastorRoleResponse result = pastorRoleService.getPastorRole(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Lead Pastor", result.getName());
    }

    @Test
    void shouldFindPastorRoleById() {
        PastorRole pastorRole = PastorRole.builder()
                .id(1L)
                .name("Lead Pastor")
                .build();

        when(pastorRoleRepository.findById(1L)).thenReturn(Optional.of(pastorRole));

        PastorRole result = pastorRoleService.findPastorRole(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Lead Pastor", result.getName());
    }

    @Test
    void shouldThrowExceptionWhenPastorRoleNotFound() {
        when(pastorRoleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> pastorRoleService.getPastorRole(99L));
    }

    @Test
    void shouldThrowExceptionWhenIdIsNull() {
        assertThrows(IllegalArgumentException.class, () -> pastorRoleService.getPastorRole(null));
        assertThrows(IllegalArgumentException.class, () -> pastorRoleService.findPastorRole(null));
    }
}
