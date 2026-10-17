package com.mikkytrionze.nkst.member.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import com.mikkytrionze.nkst.member.domain.repository.BaptismRecordRepository;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BaptismRecordServiceImplTest {

    @Mock
    private BaptismRecordRepository baptismRecordRepository;

    @InjectMocks
    private BaptismRecordServiceImpl baptismRecordService;

    @Test
    void shouldGetBaptismRecordById() {
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .id(1L)
                .serialNumber(100)
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Church")
                .bibleVerse("John 3:16")
                .baptizedBy("Pastor Mike")
                .build();

        when(baptismRecordRepository.findById(1L)).thenReturn(Optional.of(baptismRecord));

        BaptismRecord result = baptismRecordService.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(100, result.getSerialNumber());
    }

    @Test
    void shouldThrowNotFoundExceptionWhenBaptismRecordNotFound() {
        when(baptismRecordRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> baptismRecordService.getById(99L));
    }

    @Test
    void shouldThrowIllegalArgumentExceptionWhenIdIsNull() {
        assertThrows(IllegalArgumentException.class, () -> baptismRecordService.getById(null));
    }

    @Test
    void shouldSaveBaptismRecord() {
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .serialNumber(100)
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Church")
                .bibleVerse("John 3:16")
                .baptizedBy("Pastor Mike")
                .build();

        BaptismRecord savedBaptismRecord = BaptismRecord.builder()
                .id(1L)
                .serialNumber(100)
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Church")
                .bibleVerse("John 3:16")
                .baptizedBy("Pastor Mike")
                .build();

        when(baptismRecordRepository.save(any(BaptismRecord.class))).thenReturn(savedBaptismRecord);

        BaptismRecord result = baptismRecordService.save(baptismRecord);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void shouldUpdateBaptismRecord() {
        Long baptismRecordId = 1L;
        BaptismRecord existingBaptismRecord = BaptismRecord.builder()
                .id(baptismRecordId)
                .serialNumber(100)
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("Main Church")
                .bibleVerse("John 3:16")
                .baptizedBy("Pastor Mike")
                .build();

        BaptismRecord updateBaptismRecord = BaptismRecord.builder()
                .serialNumber(200)
                .dateOfBaptism(LocalDate.now())
                .worshipCenter("New Church")
                .bibleVerse("Matthew 28:19")
                .baptizedBy("Pastor Jane")
                .remark("Updated record")
                .imageUri("http://example.com/photo.jpg")
                .build();

        when(baptismRecordRepository.findById(baptismRecordId)).thenReturn(Optional.of(existingBaptismRecord));
        when(baptismRecordRepository.save(any(BaptismRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BaptismRecord result = baptismRecordService.update(baptismRecordId, updateBaptismRecord);

        assertNotNull(result);
        assertEquals(200, result.getSerialNumber());
        assertEquals("New Church", result.getWorshipCenter());
        assertEquals("Matthew 28:19", result.getBibleVerse());
        assertEquals("Pastor Jane", result.getBaptizedBy());
        assertEquals("Updated record", result.getRemark());
        assertEquals("http://example.com/photo.jpg", result.getImageUri());
    }

    @Test
    void shouldSoftDeleteBaptismRecord() {
        Long baptismRecordId = 1L;
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .id(baptismRecordId)
                .serialNumber(100)
                .build();

        when(baptismRecordRepository.findById(baptismRecordId)).thenReturn(Optional.of(baptismRecord));
        when(baptismRecordRepository.save(any(BaptismRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        baptismRecordService.delete(baptismRecordId);

        assertTrue(baptismRecord.isDeleted());
        verify(baptismRecordRepository).save(baptismRecord);
    }

    @Test
    void shouldThrowNotFoundExceptionWhenDeletingNonExistingBaptismRecord() {
        when(baptismRecordRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> baptismRecordService.delete(99L));
    }
}
