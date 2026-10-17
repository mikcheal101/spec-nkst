package com.mikkytrionze.nkst.elder.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.elder.api.request.MakeElderRequest;
import com.mikkytrionze.nkst.elder.domain.gateway.ElderEventPublisher;
import com.mikkytrionze.nkst.elder.domain.model.Elder;
import com.mikkytrionze.nkst.elder.domain.repository.ElderRepository;
import com.mikkytrionze.nkst.member.api.response.MemberResponse;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.shared.exception.DuplicateResourceException;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.nkst.shared.security.SecurityUtils;
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
class ElderServiceImplTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private ElderRepository elderRepository;

    @Mock
    private ElderEventPublisher elderEventPublisher;

    @InjectMocks
    private ElderServiceImpl elderService;

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
    void shouldGetElders() {
        Church church = church(1L);
        Member member = member(1L, 100L);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Member> elders = new PageImpl<>(List.of(member));

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(elderRepository.findAllByChurchId(1L, pageable)).thenReturn(elders);

        Page<MemberResponse> result = elderService.getElders(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().getFirst().getId());
        verify(elderRepository).findAllByChurchId(1L, pageable);
    }

    @Test
    void shouldGetElder() {
        Church church = church(1L);
        Member member = member(1L, 100L);

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(elderRepository.findByChurchId(1L, 1L)).thenReturn(Optional.of(member));

        MemberResponse result = elderService.getElder(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenElderNotFound() {
        Church church = church(1L);

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(elderRepository.findByChurchId(1L, 99L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> elderService.getElder(99L));

        assertEquals("Elder not found!", ex.getMessage());
    }

    @Test
    void shouldMakeElder() {
        Church church = church(1L);
        MakeElderRequest request = MakeElderRequest.builder().memberId(1L).build();
        Member member = member(1L, 100L);
        member.setChurch(church);
        Elder savedElder = Elder.builder().id(10L).member(member).church(church).build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(elderRepository.findByChurchId(1L, 1L)).thenReturn(Optional.empty());
        when(elderRepository.save(any(Elder.class))).thenReturn(savedElder);

        Boolean result = elderService.makeElder(request);

        assertTrue(result);
        verify(elderEventPublisher).publishElderCreated(argThat(event ->
                event.getElderId().equals(10L)
                        && event.getMemberId().equals(1L)
                        && event.getUserId().equals(100L)
                        && Boolean.TRUE.equals(event.getActivate())));
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenMemberNotFoundForMakeElder() {
        MakeElderRequest request = MakeElderRequest.builder().memberId(1L).build();

        when(memberRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> elderService.makeElder(request));

        assertEquals("Elder not found with id: 1", ex.getMessage());
    }

    @Test
    void shouldThrowDuplicateResourceExceptionWhenMemberAlreadyElder() {
        Church church = church(1L);
        MakeElderRequest request = MakeElderRequest.builder().memberId(1L).build();
        Member member = member(1L, 100L);
        member.setChurch(church);

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(elderRepository.findByChurchId(1L, 1L)).thenReturn(Optional.of(member));

        assertThrows(DuplicateResourceException.class, () -> elderService.makeElder(request));
    }

    @Test
    void shouldSearchEligibleMembersForElder() {
        Church church = church(1L);
        Member member = member(1L, 100L);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Member> churchMembers = new PageImpl<>(List.of(member));

        when(securityUtils.getLoggedInUserChurch()).thenReturn(church);
        when(elderRepository.searchEligibleMembers(1L, "John", pageable)).thenReturn(churchMembers);

        Page<MemberResponse> result = elderService.searchEligibleMembersForElder("John", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("John", result.getContent().getFirst().getFirstName());
        verify(elderRepository).searchEligibleMembers(1L, "John", pageable);
    }
}
