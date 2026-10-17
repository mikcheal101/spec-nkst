package com.mikkytrionze.nkst.member.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.member.application.dto.MemberCreatedEvent;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.member.api.request.MemberRequest;
import com.mikkytrionze.nkst.member.api.request.UpdateMemberRequest;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.member.domain.service.BaptismRecordService;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class MemberServiceImplTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private BaptismRecordService baptismRecordService;

    @Mock
    private ChurchRepository churchRepository;

    @Mock
    private com.mikkytrionze.nkst.member.domain.gateway.MemberEventPublisher memberEventPublisher;

    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private MemberServiceImpl memberService;

    @Test
    void shouldGetMemberById() {
        com.mikkytrionze.nkst.church.domain.model.Church church = com.mikkytrionze.nkst.church.domain.model.Church.builder()
                .id(1L)
                .name("Test Church")
                .address("123 Main St")
                .build();
        Member member = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .tel("1234567890")
                .gender(com.mikkytrionze.nkst.member.domain.enums.Gender.MALE)
                .church(church)
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));

        com.mikkytrionze.nkst.member.api.response.MemberResponse result = memberService.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John", result.getFirstName());
    }

    @Test
    void shouldThrowNotFoundExceptionWhenMemberNotFound() {
        when(memberRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.getById(99L));
    }

    @Test
    void shouldThrowIllegalArgumentExceptionWhenIdIsNull() {
        assertThrows(IllegalArgumentException.class, () -> memberService.getById(null));
    }

    @Test
    void shouldSaveMemberWithoutBaptismRecord() {
        com.mikkytrionze.nkst.church.domain.model.Church church = com.mikkytrionze.nkst.church.domain.model.Church.builder()
                .id(1L)
                .name("Test Church")
                .address("123 Main St")
                .build();
        MemberRequest memberRequest = MemberRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .tel("1234567890")
                .gender("MALE")
                .isBaptised(false)
                .emailAddress("john@example.com")
                .churchId(1L)
                .build();

        Member savedMember = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .tel("1234567890")
                .gender(com.mikkytrionze.nkst.member.domain.enums.Gender.MALE)
                .isBaptised(false)
                .church(church)
                .emailAddress("john@example.com")
                .build();

        when(churchRepository.findById(1L)).thenReturn(Optional.of(church));
        when(memberRepository.save(any(Member.class))).thenReturn(savedMember);

        com.mikkytrionze.nkst.member.api.response.MemberResponse result = memberService.saveMember(memberRequest);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(baptismRecordService, never()).save(any());
    }

    @Test
    void shouldSoftDeleteMember() {
        com.mikkytrionze.nkst.church.domain.model.Church church = com.mikkytrionze.nkst.church.domain.model.Church.builder()
                .id(1L)
                .name("Test Church")
                .address("123 Main St")
                .build();
        Long memberId = 1L;
        Member member = Member.builder()
                .id(memberId)
                .firstName("John")
                .lastName("Doe")
                .church(church)
                .build();

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        memberService.deleteMember(memberId);

        assertTrue(member.isDeleted());
        verify(memberRepository).save(member);
    }

    @Test
    void shouldThrowNotFoundExceptionWhenDeletingNonExistingMember() {
        when(memberRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.deleteMember(99L));
    }

    @Test
    void shouldThrowExceptionWhenDeletingWithNullId() {
        assertThrows(IllegalArgumentException.class, () -> memberService.deleteMember(null));
    }

    @Test
    void shouldThrowExceptionWhenIdIsZero() {
        assertThrows(IllegalArgumentException.class, () -> memberService.getById(0L));
    }

    @Test
    void shouldSaveMemberWithBaptismRecord() {
        Church church = Church.builder().id(1L).name("Test Church").address("123 Main St").build();
        BaptismRecord baptismRecord = BaptismRecord.builder()
                .id(10L)
                .dateOfBaptism(LocalDate.parse("2024-01-15"))
                .bibleVerse("Mark 16:16")
                .serialNumber(100)
                .baptizedBy("Pastor John")
                .worshipCenter("Main Church")
                .build();

        MemberRequest memberRequest = MemberRequest.builder()
                .firstName("Jane")
                .lastName("Doe")
                .tel("0987654321")
                .gender("FEMALE")
                .isBaptised(true)
                .emailAddress("jane@example.com")
                .churchId(1L)
                .dateOfBaptism(LocalDate.parse("2024-01-15"))
                .bibleVerse("Mark 16:16")
                .serialNumber(100)
                .baptisedBy("Pastor John")
                .worshipCenter("Main Church")
                .build();

        Member savedMember = Member.builder()
                .id(2L)
                .firstName("Jane")
                .lastName("Doe")
                .tel("0987654321")
                .gender(Gender.FEMALE)
                .isBaptised(true)
                .church(church)
                .baptismRecord(baptismRecord)
                .emailAddress("jane@example.com")
                .build();

        when(churchRepository.findById(1L)).thenReturn(Optional.of(church));
        when(baptismRecordService.save(any(BaptismRecord.class))).thenReturn(baptismRecord);
        when(memberRepository.save(any(Member.class))).thenReturn(savedMember);

        MemberResponse result = memberService.saveMember(memberRequest);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertTrue(result.isBaptised());
        verify(baptismRecordService).save(any(BaptismRecord.class));
    }

    @Test
    void shouldGetAllMembers() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member member = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).church(church)
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        Page<Member> memberPage = new PageImpl<>(List.of(member));

        when(memberRepository.findAll(pageable)).thenReturn(memberPage);

        Page<MemberResponse> result = memberService.getAllMembers(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void shouldGetAllChurchMembers() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member member = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).church(church)
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        Page<Member> memberPage = new PageImpl<>(List.of(member));

        when(memberRepository.findAllByChurchId(1L, pageable)).thenReturn(memberPage);

        Page<MemberResponse> result = memberService.getAllChurchMembers(1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void shouldGetChurchMember() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member member = Member.builder()
                .id(2L).firstName("Jane").lastName("Smith")
                .tel("0987654321").gender(Gender.FEMALE).church(church)
                .build();

        when(memberRepository.findById(2L)).thenReturn(Optional.of(member));

        MemberResponse result = memberService.getChurchMember(1L, 2L);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("Jane", result.getFirstName());
    }

    @Test
    void shouldGetChurchMemberWithZeroChurchIdSkipsChurchCheck() {
        Church church = Church.builder().id(2L).name("Test Church").build();
        Member member = Member.builder()
                .id(2L).firstName("Jane").church(church)
                .tel("0987654321").gender(Gender.FEMALE)
                .build();

        when(memberRepository.findById(2L)).thenReturn(Optional.of(member));

        MemberResponse result = memberService.getChurchMember(0L, 2L);

        assertNotNull(result);
        assertEquals(2L, result.getId());
    }

    @Test
    void shouldThrowNotFoundExceptionWhenChurchMemberNotFoundInDifferentChurch() {
        Church church2 = Church.builder().id(2L).name("Church 2").build();
        Member member = Member.builder()
                .id(2L).firstName("Jane").church(church2)
                .tel("0987654321").gender(Gender.FEMALE)
                .build();

        when(memberRepository.findById(2L)).thenReturn(Optional.of(member));

        assertThrows(ResourceNotFoundException.class, () -> memberService.getChurchMember(1L, 2L));
    }

    @Test
    void shouldUpdateMemberWithoutBaptismRecord() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member existingMember = Member.builder()
                .id(1L).firstName("Old").lastName("Name")
                .tel("1234567890").gender(Gender.MALE).isBaptised(false)
                .church(church).emailAddress("old@example.com")
                .build();
        UpdateMemberRequest updateRequest = UpdateMemberRequest.builder()
                .firstName("New").lastName("Name")
                .gender("MALE")
                .isBaptised(false)
                .build();

        Member updatedMember = Member.builder()
                .id(1L).firstName("New").lastName("Name")
                .tel("1234567890").gender(Gender.MALE).isBaptised(false)
                .church(church).emailAddress("new@example.com")
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(existingMember));
        when(memberRepository.save(any(Member.class))).thenReturn(updatedMember);

        MemberResponse result = memberService.updateMember(1L, updateRequest);

        assertNotNull(result);
        assertEquals("New", result.getFirstName());
        verify(baptismRecordService, never()).update(any(), any());
    }

    @Test
    void shouldUpdateMemberWithBaptismRecord() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        BaptismRecord existingRecord = BaptismRecord.builder()
                .id(10L).dateOfBaptism(LocalDate.parse("2023-01-01"))
                .bibleVerse("Mark 16:16").serialNumber(1).baptizedBy("Pastor A")
                .worshipCenter("Main Church").build();
        Member existingMember = Member.builder()
                .id(1L).firstName("Old").lastName("Name")
                .tel("1234567890").gender(Gender.MALE).isBaptised(true)
                .church(church).baptismRecord(existingRecord)
                .build();
        UpdateMemberRequest updateRequest = UpdateMemberRequest.builder()
                .firstName("New").lastName("Name")
                .gender("MALE")
                .isBaptised(true)
                .dateOfBaptism(LocalDate.parse("2024-06-01"))
                .bibleVerse("Acts 2:38").serialNumber(2)
                .baptisedBy("Pastor B").worshipCenter("New Church")
                .build();
        BaptismRecord updatedRecord = BaptismRecord.builder()
                .id(10L).dateOfBaptism(LocalDate.parse("2024-06-01"))
                .bibleVerse("Acts 2:38").serialNumber(2).baptizedBy("Pastor B")
                .worshipCenter("New Church").build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(existingMember));
        when(baptismRecordService.update(eq(10L), any(BaptismRecord.class))).thenReturn(updatedRecord);
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberResponse result = memberService.updateMember(1L, updateRequest);

        assertNotNull(result);
        verify(baptismRecordService).update(eq(10L), any(BaptismRecord.class));
    }

    @Test
    void shouldUpdateMemberWithNewChurch() {
        Church newChurch = Church.builder().id(2L).name("New Church").build();
        Church oldChurch = Church.builder().id(1L).name("Old Church").build();
        Member existingMember = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).isBaptised(false)
                .church(oldChurch).emailAddress("john@example.com")
                .build();
        UpdateMemberRequest updateRequest = UpdateMemberRequest.builder()
                .firstName("John").lastName("Doe")
                .gender("MALE")
                .isBaptised(false)
                .churchId(2L)
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(existingMember));
        when(churchRepository.findById(2L)).thenReturn(Optional.of(newChurch));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberResponse result = memberService.updateMember(1L, updateRequest);

        assertNotNull(result);
    }

    @Test
    void shouldFindMemberById() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member member = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).church(church)
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));

        Member result = memberService.findMemberById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John", result.getFirstName());
    }

    @Test
    void shouldThrowChurchNotFoundExceptionWhenSavingMember() {
        MemberRequest memberRequest = MemberRequest.builder()
                .firstName("John").lastName("Doe")
                .tel("1234567890").gender("MALE")
                .isBaptised(false).emailAddress("john@example.com")
                .churchId(99L).build();

        when(churchRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.saveMember(memberRequest));
    }

    @Test
    void shouldUseEmailAddressAsUsernameWhenTelIsBlank() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        MemberRequest memberRequest = MemberRequest.builder()
                .firstName("John").lastName("Doe")
                .tel("   ")
                .gender("MALE").isBaptised(false)
                .emailAddress("John@Example.com").churchId(1L).build();

        Member savedMember = Member.builder()
                .id(1L).firstName("John").lastName("Doe").tel("   ")
                .gender(Gender.MALE).isBaptised(false)
                .emailAddress("John@Example.com").church(church).build();

        when(churchRepository.findById(1L)).thenReturn(Optional.of(church));
        when(memberRepository.save(any(Member.class))).thenReturn(savedMember);

        memberService.saveMember(memberRequest);

        ArgumentCaptor<MemberCreatedEvent> captor = ArgumentCaptor.forClass(MemberCreatedEvent.class);
        verify(memberEventPublisher).publishMemberCreated(captor.capture());
        assertEquals("john@example.com", captor.getValue().getUsername());
        assertEquals(List.of("MEMBER_UNBAPTISED"), captor.getValue().getRoles());
    }

    @Test
    void shouldThrowChurchNotFoundExceptionWhenUpdatingMember() {
        Church oldChurch = Church.builder().id(1L).name("Old Church").build();
        Member existingMember = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).isBaptised(false)
                .church(oldChurch).emailAddress("john@example.com").build();
        UpdateMemberRequest updateRequest = UpdateMemberRequest.builder()
                .firstName("John").lastName("Doe")
                .gender("MALE").isBaptised(false)
                .churchId(99L).build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(existingMember));
        when(churchRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.updateMember(1L, updateRequest));
    }

    @Test
    void shouldFetchProspectiveAdmins() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member member = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).church(church)
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        Page<Member> memberPage = new PageImpl<>(List.of(member));

        when(memberRepository.findAllByChurchIdAndUserTypeChurchAdmin(1L, pageable)).thenReturn(memberPage);

        Page<MemberResponse> result = memberService.fetchProspectiveAdmins(1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void shouldProcessUserUpdatedEvent() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member member = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).church(church)
                .build();
        UserUpdatedEvent event = UserUpdatedEvent.builder().memberId(1L).userId(2L).build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(memberRepository.saveAndFlush(member)).thenReturn(member);

        memberService.processUserUpdatedEvent(event);

        assertEquals(2L, member.getUserId());
        verify(memberRepository).saveAndFlush(member);
    }

    @Test
    void shouldThrowResourceNotFoundWhenProcessingUserUpdatedEventForUnknownMember() {
        UserUpdatedEvent event = UserUpdatedEvent.builder().memberId(99L).userId(2L).build();

        when(memberRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> memberService.processUserUpdatedEvent(event));
    }

    @Test
    void shouldSearchMembers() {
        Church church = Church.builder().id(1L).name("Test Church").build();
        Member member = Member.builder()
                .id(1L).firstName("John").lastName("Doe")
                .tel("1234567890").gender(Gender.MALE).church(church)
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        Page<Member> memberPage = new PageImpl<>(List.of(member));

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(memberRepository.findByChurchIdAndName(1L, "John", pageable)).thenReturn(memberPage);

        Page<MemberResponse> result = memberService.searchMembers("John", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
