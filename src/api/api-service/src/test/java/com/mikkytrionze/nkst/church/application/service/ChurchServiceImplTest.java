package com.mikkytrionze.nkst.church.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.nkst.church.api.request.ChurchRequest;
import com.mikkytrionze.nkst.church.api.response.ChurchResponse;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class ChurchServiceImplTest {

    @Mock
    private ChurchRepository churchRepository;

    private ChurchServiceImpl churchService;

    @BeforeEach
    void setUp() {
        churchService = new ChurchServiceImpl(churchRepository);
    }

    @Test
    void shouldGetChurchById() {
        String mainChurch = "Main Church";
        Church church = Church.builder().id(1L).name(mainChurch).build();

        when(churchRepository.findById(1L)).thenReturn(Optional.of(church));

        ChurchResponse result = churchService.getChurch(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(mainChurch, result.getName());
    }

    @Test
    void shouldThrowNotFoundExceptionWhenChurchNotFound() {
        when(churchRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> churchService.getChurch(99L));
    }

    @Test
    void shouldThrowExceptionWhenGetChurchWithNullId() {
        assertThrows(IllegalArgumentException.class, () -> churchService.getChurch(null));
    }

    @Test
    void shouldGetAllChurches() {
        String mainChurch = "Main Church";
        Church church = Church.builder()
                .id(1L)
                .name(mainChurch)
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        Page<Church> churchPage = new PageImpl<>(List.of(church));

        when(churchRepository.findAll(pageable)).thenReturn(churchPage);

        Page<ChurchResponse> result = churchService.getChurches(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(mainChurch, result.getContent().getFirst().getName());
    }

    @Test
    void shouldCreateChurchWithoutParent() {
        ChurchRequest request = ChurchRequest.builder()
                .name("New Church")
                .address("456 Oak St")
                .build();

        Church savedChurch = Church.builder()
                .id(1L)
                .name("NEW CHURCH")
                .address("456 Oak St")
                .build();

        when(churchRepository.save(any(Church.class))).thenReturn(savedChurch);

        ChurchResponse result = churchService.createChurch(request);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("NEW CHURCH", result.getName());
        assertEquals("456 Oak St", result.getAddress());
    }

    @Test
    void shouldCreateChurchWithParent() {
        ChurchRequest request = ChurchRequest.builder()
                .name("Child Church")
                .address("789 Pine St")
                .parentChurchId(1L)
                .build();

        Church parentChurch = Church.builder().id(1L).name("Parent Church").build();
        Church savedChurch = Church.builder()
                .id(2L)
                .name("CHILD CHURCH")
                .address("789 Pine St")
                .parentChurch(parentChurch)
                .build();

        when(churchRepository.findById(1L)).thenReturn(Optional.of(parentChurch));
        when(churchRepository.save(any(Church.class))).thenReturn(savedChurch);

        ChurchResponse result = churchService.createChurch(request);

        assertNotNull(result);
        assertEquals(2L, result.getId());
    }

    @Test
    void shouldUpdateChurch() {
        Long churchId = 1L;
        ChurchRequest request = ChurchRequest.builder()
                .name("Updated Church")
                .address("321 New St")
                .build();

        Church existingChurch = Church.builder()
                .id(churchId)
                .name("OLD CHURCH")
                .address("Old Address")
                .build();

        Church updatedChurch = Church.builder()
                .id(churchId)
                .name("UPDATED CHURCH")
                .address("321 New St")
                .build();

        when(churchRepository.findById(churchId)).thenReturn(Optional.of(existingChurch));
        when(churchRepository.existsByName("Updated Church")).thenReturn(false);
        when(churchRepository.save(any(Church.class))).thenReturn(updatedChurch);

        ChurchResponse result = churchService.updateChurch(churchId, request);

        assertNotNull(result);
        assertEquals("UPDATED CHURCH", result.getName());
        assertEquals("321 New St", result.getAddress());
    }

    @Test
    void shouldThrowDataIntegrityViolationOnDuplicateName() {
        Long churchId = 1L;
        ChurchRequest request = ChurchRequest.builder()
                .name("Existing Church")
                .address("Addr")
                .build();

        Church existingChurch = Church.builder()
                .id(churchId)
                .name("OLD CHURCH")
                .address("Old Addr")
                .build();

        when(churchRepository.findById(churchId)).thenReturn(Optional.of(existingChurch));
        when(churchRepository.existsByName("Existing Church")).thenReturn(true);

        assertThrows(DataIntegrityViolationException.class,
                () -> churchService.updateChurch(churchId, request));
    }

    @Test
    void shouldAllowUpdateWhenNameUnchanged() {
        Long churchId = 1L;
        ChurchRequest request = ChurchRequest.builder()
                .name("Same Church")
                .address("New Address")
                .build();

        Church existingChurch = Church.builder()
                .id(churchId)
                .name("SAME CHURCH")
                .address("Old Address")
                .build();

        Church updatedChurch = Church.builder()
                .id(churchId)
                .name("SAME CHURCH")
                .address("New Address")
                .build();

        when(churchRepository.findById(churchId)).thenReturn(Optional.of(existingChurch));
        when(churchRepository.save(any(Church.class))).thenReturn(updatedChurch);

        ChurchResponse result = churchService.updateChurch(churchId, request);

        assertNotNull(result);
        assertEquals("SAME CHURCH", result.getName());
        assertEquals("New Address", result.getAddress());
    }

    @Test
    void shouldUpdateChurchWithNewParent() {
        Long churchId = 1L;
        Long newParentId = 20L;
        Church parent = Church.builder().id(newParentId).name("New Parent").build();
        ChurchRequest request = ChurchRequest.builder()
                .name("Updated Church")
                .address("321 New St")
                .parentChurchId(newParentId)
                .build();

        Church existingParent = Church.builder().id(10L).name("Old Parent").build();
        Church existingChurch = Church.builder()
                .id(churchId)
                .name("OLD CHURCH")
                .address("Old Address")
                .parentChurch(existingParent)
                .build();

        Church updatedChurch = Church.builder()
                .id(churchId)
                .name("UPDATED CHURCH")
                .address("321 New St")
                .parentChurch(parent)
                .build();

        when(churchRepository.findById(churchId)).thenReturn(Optional.of(existingChurch));
        when(churchRepository.findById(newParentId)).thenReturn(Optional.of(parent));
        when(churchRepository.existsByName("Updated Church")).thenReturn(false);
        when(churchRepository.save(any(Church.class))).thenReturn(updatedChurch);

        ChurchResponse result = churchService.updateChurch(churchId, request);

        assertNotNull(result);
        assertEquals("UPDATED CHURCH", result.getName());
    }

    @Test
    void shouldUpdateChurchKeepingSameParent() {
        Long churchId = 1L;
        Long parentId = 10L;
        Church parent = Church.builder().id(parentId).name("Parent").build();
        ChurchRequest request = ChurchRequest.builder()
                .name("Updated Church")
                .address("321 New St")
                .parentChurchId(parentId)
                .build();

        Church existingChurch = Church.builder()
                .id(churchId)
                .name("OLD CHURCH")
                .address("Old Address")
                .parentChurch(parent)
                .build();

        Church updatedChurch = Church.builder()
                .id(churchId)
                .name("UPDATED CHURCH")
                .address("321 New St")
                .parentChurch(parent)
                .build();

        when(churchRepository.findById(churchId)).thenReturn(Optional.of(existingChurch));
        when(churchRepository.existsByName("Updated Church")).thenReturn(false);
        when(churchRepository.save(any(Church.class))).thenReturn(updatedChurch);

        ChurchResponse result = churchService.updateChurch(churchId, request);

        assertNotNull(result);
        assertEquals("UPDATED CHURCH", result.getName());
    }

    @Test
    void shouldUpdateChurchClearingParent() {
        Long churchId = 1L;
        Church parent = Church.builder().id(10L).name("Parent").build();
        ChurchRequest request = ChurchRequest.builder()
                .name("Updated Church")
                .address("321 New St")
                .build();

        Church existingChurch = Church.builder()
                .id(churchId)
                .name("OLD CHURCH")
                .address("Old Address")
                .parentChurch(parent)
                .build();

        Church updatedChurch = Church.builder()
                .id(churchId)
                .name("UPDATED CHURCH")
                .address("321 New St")
                .parentChurch(parent)
                .build();

        when(churchRepository.findById(churchId)).thenReturn(Optional.of(existingChurch));
        when(churchRepository.existsByName("Updated Church")).thenReturn(false);
        when(churchRepository.save(any(Church.class))).thenReturn(updatedChurch);

        ChurchResponse result = churchService.updateChurch(churchId, request);

        assertNotNull(result);
        assertEquals("UPDATED CHURCH", result.getName());
    }

    @Test
    void shouldSoftDeleteChurch() {
        Long churchId = 1L;
        Church church = Church.builder().id(churchId).name("To Delete").build();

        when(churchRepository.findById(churchId)).thenReturn(Optional.of(church));
        when(churchRepository.save(any(Church.class))).thenAnswer(invocation -> invocation.getArgument(0));

        churchService.deleteChurch(churchId);

        assertTrue(church.isDeleted());
        verify(churchRepository).save(church);
    }

    @Test
    void shouldThrowResourceNotFoundExceptionOnDeleteNonExisting() {
        when(churchRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> churchService.deleteChurch(99L));
    }

    @Test
    void shouldFindChurchById() {
        Church church = Church.builder().id(1L).name("Main Church").build();
        when(churchRepository.findById(1L)).thenReturn(Optional.of(church));

        Church result = churchService.findChurchById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void shouldReturnNullWhenFindChurchByIdNotFound() {
        when(churchRepository.findById(99L)).thenReturn(Optional.empty());

        assertNull(churchService.findChurchById(99L));
    }

    @Test
    void shouldReturnAllSubChurches() {
        Church parentChurch = Church.builder()
                .id(1L)
                .name("Main Church")
                .address("Main Church Address")
                .subChurches(List.of(
                        Church.builder()
                                .id(2L)
                                .name("Church II")
                                .address("Church II address")
                                .build(),
                        Church.builder()
                                .id(3L)
                                .name("Church III")
                                .address("Church III address")
                                .build()
                ))
                .build();

        Page<Church> subChurchesPage = new PageImpl<>(parentChurch.getSubChurches());
        PageRequest pageRequest = PageRequest.of(0, 20);

        when(churchRepository.findByParentChurchId(1L, pageRequest)).thenReturn(subChurchesPage);

        Page<ChurchResponse> response = churchService.getSubChurches(1L, pageRequest);

        assertEquals(2L, response.getTotalElements());
        assertNotNull(response);
        assertEquals("Church II", response.getContent().getFirst().getName());
    }
}
