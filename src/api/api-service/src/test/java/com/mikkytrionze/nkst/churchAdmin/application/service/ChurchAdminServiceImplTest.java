package com.mikkytrionze.nkst.churchAdmin.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.churchAdmin.domain.gateway.ChurchAdminEventPublisher;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChurchAdminServiceImplTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private ChurchRepository churchRepository;

    @Mock
    private ChurchAdminEventPublisher churchAdminEventPublisher;

    @InjectMocks
    private ChurchAdminServiceImpl churchAdminService;

    private Church church;
    private Member newAdmin;
    private Member existingAdmin;

    @BeforeEach
    void setUp() {
        church = Church.builder()
                .id(5L)
                .name("Main Church")
                .address("Address")
                .build();
        newAdmin = Member.builder()
                .id(1L)
                .userId(100L)
                .firstName("New")
                .lastName("Admin")
                .church(church)
                .isAdmin(false)
                .build();
        existingAdmin = Member.builder()
                .id(2L)
                .userId(200L)
                .firstName("Old")
                .lastName("Admin")
                .church(church)
                .isAdmin(true)
                .build();
    }

    @Test
    void shouldSetChurchAdmin_whenNoExistingAdmin() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(newAdmin));
        when(memberRepository.findByChurchIdAndIsAdminTrue(5L)).thenReturn(Optional.empty());

        Boolean result = churchAdminService.setChurchAdmin(1L);

        assertTrue(result);
        assertTrue(newAdmin.isAdmin());
        verify(memberRepository).save(newAdmin);

        ArgumentCaptor<ChurchAdminUpdatedEvent> captor = ArgumentCaptor.forClass(ChurchAdminUpdatedEvent.class);
        verify(churchAdminEventPublisher, times(1)).publishChurchAdminUpdated(captor.capture());
        ChurchAdminUpdatedEvent event = captor.getValue();
        assertEquals(Boolean.TRUE, event.getActivate());
        assertEquals(100L, event.getMemberId());
        assertEquals(5L, event.getChurchId());
    }

    @Test
    void shouldSetChurchAdmin_whenExistingAdminPresent_andBothHaveUserIds() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(newAdmin));
        when(memberRepository.findByChurchIdAndIsAdminTrue(5L)).thenReturn(Optional.of(existingAdmin));

        Boolean result = churchAdminService.setChurchAdmin(1L);

        assertTrue(result);
        assertFalse(existingAdmin.isAdmin());
        assertTrue(newAdmin.isAdmin());
        verify(memberRepository).save(existingAdmin);
        verify(memberRepository).save(newAdmin);

        ArgumentCaptor<ChurchAdminUpdatedEvent> captor = ArgumentCaptor.forClass(ChurchAdminUpdatedEvent.class);
        verify(churchAdminEventPublisher, times(2)).publishChurchAdminUpdated(captor.capture());
        List<ChurchAdminUpdatedEvent> events = captor.getAllValues();
        assertEquals(Boolean.FALSE, events.get(0).getActivate());
        assertEquals(200L, events.get(0).getMemberId());
        assertEquals(5L, events.get(0).getChurchId());
        assertEquals(Boolean.TRUE, events.get(1).getActivate());
        assertEquals(100L, events.get(1).getMemberId());
        assertEquals(5L, events.get(1).getChurchId());
    }

    @Test
    void shouldSetChurchAdmin_whenExistingAdminHasNullUserId() {
        existingAdmin.setUserId(null);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(newAdmin));
        when(memberRepository.findByChurchIdAndIsAdminTrue(5L)).thenReturn(Optional.of(existingAdmin));

        Boolean result = churchAdminService.setChurchAdmin(1L);

        assertTrue(result);
        assertFalse(existingAdmin.isAdmin());
        assertTrue(newAdmin.isAdmin());
        verify(memberRepository).save(existingAdmin);
        verify(memberRepository).save(newAdmin);

        ArgumentCaptor<ChurchAdminUpdatedEvent> captor = ArgumentCaptor.forClass(ChurchAdminUpdatedEvent.class);
        verify(churchAdminEventPublisher, times(1)).publishChurchAdminUpdated(captor.capture());
        assertEquals(Boolean.TRUE, captor.getValue().getActivate());
        assertEquals(100L, captor.getValue().getMemberId());
    }

    @Test
    void shouldSetChurchAdmin_whenNewAdminHasNullUserId() {
        newAdmin.setUserId(null);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(newAdmin));
        when(memberRepository.findByChurchIdAndIsAdminTrue(5L)).thenReturn(Optional.of(existingAdmin));

        Boolean result = churchAdminService.setChurchAdmin(1L);

        assertTrue(result);
        assertFalse(existingAdmin.isAdmin());
        verify(memberRepository).save(existingAdmin);
        verify(memberRepository).save(newAdmin);

        ArgumentCaptor<ChurchAdminUpdatedEvent> captor = ArgumentCaptor.forClass(ChurchAdminUpdatedEvent.class);
        verify(churchAdminEventPublisher, times(1)).publishChurchAdminUpdated(captor.capture());
        assertEquals(Boolean.FALSE, captor.getValue().getActivate());
        assertEquals(200L, captor.getValue().getMemberId());
    }

    @Test
    void shouldSetChurchAdmin_whenNoExistingAdmin_andNewAdminHasNullUserId_publishesNothing() {
        newAdmin.setUserId(null);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(newAdmin));
        when(memberRepository.findByChurchIdAndIsAdminTrue(5L)).thenReturn(Optional.empty());

        Boolean result = churchAdminService.setChurchAdmin(1L);

        assertTrue(result);
        assertTrue(newAdmin.isAdmin());
        verify(memberRepository).save(newAdmin);
        verifyNoInteractions(churchAdminEventPublisher);
    }

    @Test
    void shouldThrowResourceNotFoundException_whenMemberNotFound() {
        when(memberRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> churchAdminService.setChurchAdmin(99L));

        assertEquals("Member not found with id: 99", exception.getMessage());
    }

    @Test
    void shouldReturnTrue_whenChurchHasAdmin() {
        when(churchRepository.findById(5L)).thenReturn(Optional.of(church));
        when(memberRepository.findByChurchIdAndIsAdminTrue(5L)).thenReturn(Optional.of(newAdmin));

        Boolean result = churchAdminService.churchHasAdmin(5L);

        assertTrue(result);
    }

    @Test
    void shouldReturnFalse_whenChurchHasNoAdmin() {
        when(churchRepository.findById(5L)).thenReturn(Optional.of(church));
        when(memberRepository.findByChurchIdAndIsAdminTrue(5L)).thenReturn(Optional.empty());

        Boolean result = churchAdminService.churchHasAdmin(5L);

        assertFalse(result);
    }

    @Test
    void shouldThrowResourceNotFoundException_whenChurchNotFound() {
        when(churchRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> churchAdminService.churchHasAdmin(99L));

        assertEquals("Church not found with id: 99", exception.getMessage());
    }
}
