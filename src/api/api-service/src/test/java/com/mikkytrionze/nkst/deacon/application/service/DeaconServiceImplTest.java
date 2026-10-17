package com.mikkytrionze.nkst.deacon.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.deacon.api.request.MakeDeaconRequest;
import com.mikkytrionze.nkst.deacon.domain.gateway.DeaconEventPublisher;
import com.mikkytrionze.nkst.deacon.domain.model.Deacon;
import com.mikkytrionze.nkst.deacon.domain.repository.DeaconRepository;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.member.domain.service.BaptismRecordService;
import com.mikkytrionze.nkst.shared.exception.DuplicateResourceException;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class DeaconServiceImplTest {

    @Mock
    private DeaconRepository deaconRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private ChurchRepository churchRepository;

    @Mock
    private BaptismRecordService baptismRecordService;

    @Mock
    private DeaconEventPublisher deaconEventPublisher;

    @InjectMocks
    private DeaconServiceImpl deaconService;

    private Church church(Long id) {
        return Church.builder()
                .id(id)
                .name("Test Church")
                .address("1 Main St")
                .build();
    }

    private Member member(Long id, Long userId) {
        return Member.builder()
                .id(id)
                .tel("1234567890")
                .firstName("John")
                .middleName("M")
                .lastName("Doe")
                .gender(Gender.MALE)
                .emailAddress("john@test.com")
                .isBaptised(true)
                .isAdmin(false)
                .userId(userId)
                .address("1 Main St")
                .build();
    }

    @Test
    void shouldFetchDeacons() {
        Church church = church(1L);
        Member member = member(1L, 100L);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Member> deacons = new PageImpl<>(List.of(member));

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findAllByChurchId(1L, pageable)).thenReturn(deacons);

        Page<MemberResponse> result = deaconService.fetchDeacons(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().getFirst().getId());
        verify(deaconRepository).findAllByChurchId(1L, pageable);
    }

    @Test
    void shouldSearchProspectiveDeacons() {
        Church church = church(1L);
        Member member = member(1L, 100L);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Member> prospectiveMembers = new PageImpl<>(List.of(member));

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.searchEligibleMembers(1L, "John", pageable)).thenReturn(prospectiveMembers);

        Page<MemberResponse> result = deaconService.searchProspectiveDeacons("John", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("John", result.getContent().getFirst().getFirstName());
        verify(deaconRepository).searchEligibleMembers(1L, "John", pageable);
    }

    @Test
    void shouldGetDeacon() {
        Church church = church(1L);
        Member member = member(1L, 100L);

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findByChurchId(1L, 1L)).thenReturn(Optional.of(member));

        MemberResponse result = deaconService.getDeacon(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenDeaconNotFound() {
        Church church = church(1L);

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findByChurchId(1L, 99L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> deaconService.getDeacon(99L));

        assertEquals("Deacon not found!", ex.getMessage());
    }

    @Test
    void shouldCreateDeacon() {
        Church church = church(1L);
        MakeDeaconRequest request = MakeDeaconRequest.builder().memberId(1L).build();
        Member member = member(1L, 100L);
        member.setChurch(church);
        Deacon savedDeacon = Deacon.builder().id(10L).member(member).church(church).build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(deaconRepository.findByChurchId(1L, 1L)).thenReturn(Optional.empty());
        when(deaconRepository.save(any(Deacon.class))).thenReturn(savedDeacon);

        Boolean result = deaconService.createDeacon(request);

        assertTrue(result);
        verify(deaconEventPublisher).publishDeaconCreated(argThat(event ->
                event.getDeaconId().equals(10L)
                        && event.getMemberId().equals(1L)
                        && event.getUserId().equals(100L)
                        && Boolean.TRUE.equals(event.getActivate())));
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenMemberNotFoundForCreateDeacon() {
        MakeDeaconRequest request = MakeDeaconRequest.builder().memberId(1L).build();

        when(memberRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> deaconService.createDeacon(request));

        assertEquals("Deacon not found with id: 1", ex.getMessage());
    }

    @Test
    void shouldThrowDuplicateResourceExceptionWhenMemberAlreadyDeacon() {
        Church church = church(1L);
        MakeDeaconRequest request = MakeDeaconRequest.builder().memberId(1L).build();
        Member member = member(1L, 100L);
        member.setChurch(church);

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(deaconRepository.findByChurchId(1L, 1L)).thenReturn(Optional.of(member));

        assertThrows(DuplicateResourceException.class, () -> deaconService.createDeacon(request));
    }

    @Test
    void shouldUpdateDeaconWithChurchAndBaptised() {
        Long id = 1L;
        Church church = church(1L);
        Church newChurch = church(2L);
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .id(7L)
                .serialNumber(1)
                .dateOfBaptism(LocalDate.of(2020, 1, 1))
                .worshipCenter("Old WC")
                .bibleVerse("Old Verse")
                .baptizedBy("Pastor 1")
                .build();
        Member member = member(id, 100L);
        member.setChurch(church);
        member.setBaptismRecord(baptismRecord);
        Deacon deacon = Deacon.builder().id(id).member(member).church(church).build();

        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .lastName("Doe")
                .firstName("John")
                .middleName("M")
                .gender("MALE")
                .churchId(2L)
                .address("2 New St")
                .isBaptised(true)
                .serialNumber(2)
                .worshipCenter("New WC")
                .bibleVerse("New Verse")
                .baptisedBy("Pastor 2")
                .remark("ok")
                .dateOfBaptism(LocalDate.of(2021, 5, 5))
                .build();

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findByIdAndChurchId(id, 1L)).thenReturn(Optional.of(deacon));
        when(churchRepository.findById(2L)).thenReturn(Optional.of(newChurch));
        when(baptismRecordService.update(eq(7L), any(BaptismRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(1));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberResponse result = deaconService.updateDeacon(id, request);

        assertNotNull(result);
        assertEquals(id, result.getId());
        assertEquals("New WC", result.getBaptismRecord().getWorshipCenter());
        assertEquals("New Verse", result.getBaptismRecord().getBibleVerse());
        assertEquals(2L, result.getChurch().getId());
        verify(churchRepository).findById(2L);
        verify(baptismRecordService).update(eq(7L), any(BaptismRecord.class));
        verify(memberRepository).save(member);
    }

    @Test
    void shouldUpdateDeaconWithoutChurchIdAndNotBaptised() {
        Long id = 1L;
        Church church = church(1L);
        Member member = member(id, 100L);
        member.setChurch(church);
        Deacon deacon = Deacon.builder().id(id).member(member).church(church).build();

        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .lastName("Doe")
                .firstName("Jane")
                .gender("FEMALE")
                .isBaptised(false)
                .build();

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findByIdAndChurchId(id, 1L)).thenReturn(Optional.of(deacon));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberResponse result = deaconService.updateDeacon(id, request);

        assertNotNull(result);
        assertEquals("FEMALE", result.getGender());
        verify(churchRepository, never()).findById(any());
        verify(baptismRecordService, never()).update(any(), any());
    }

    @Test
    void shouldUpdateDeaconWithChurchIdNotBaptised() {
        Long id = 1L;
        Church church = church(1L);
        Church newChurch = church(2L);
        Member member = member(id, 100L);
        member.setChurch(church);
        Deacon deacon = Deacon.builder().id(id).member(member).church(church).build();

        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .lastName("Doe")
                .firstName("John")
                .gender("MALE")
                .churchId(2L)
                .isBaptised(false)
                .build();

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findByIdAndChurchId(id, 1L)).thenReturn(Optional.of(deacon));
        when(churchRepository.findById(2L)).thenReturn(Optional.of(newChurch));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberResponse result = deaconService.updateDeacon(id, request);

        assertNotNull(result);
        assertEquals(2L, result.getChurch().getId());
        verify(churchRepository).findById(2L);
        verify(baptismRecordService, never()).update(any(), any());
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenDeaconNotFoundForUpdate() {
        Long id = 1L;
        Church church = church(1L);
        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .lastName("Doe")
                .firstName("John")
                .gender("MALE")
                .build();

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findByIdAndChurchId(id, 1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> deaconService.updateDeacon(id, request));

        assertEquals("Deacon not found with id: 1", ex.getMessage());
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenChurchNotFoundForUpdate() {
        Long id = 1L;
        Church church = church(1L);
        Member member = member(id, 100L);
        member.setChurch(church);
        Deacon deacon = Deacon.builder().id(id).member(member).church(church).build();

        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .lastName("Doe")
                .firstName("John")
                .gender("MALE")
                .churchId(9L)
                .isBaptised(false)
                .build();

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(deaconRepository.findByIdAndChurchId(id, 1L)).thenReturn(Optional.of(deacon));
        when(churchRepository.findById(9L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> deaconService.updateDeacon(id, request));

        assertEquals("Church not found with id: 9", ex.getMessage());
    }
}
