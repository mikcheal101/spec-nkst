package com.mikkytrionze.nkst.pastor.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.service.ChurchService;
import com.mikkytrionze.nkst.member.domain.enums.Gender;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.service.MemberService;
import com.mikkytrionze.nkst.pastor.api.request.PastorRequest;
import com.mikkytrionze.nkst.pastor.api.response.PastorResponse;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;
import com.mikkytrionze.nkst.pastor.domain.repository.PastorRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.mikkytrionze.nkst.pastor.domain.service.PastorRoleService;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class PastorServiceImplTest {

    @Mock
    private PastorRepository pastorRepository;

    @Mock
    private ChurchService churchService;

    @Mock
    private PastorRoleService pastorRoleService;

    @Mock
    private MemberService memberService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private PastorServiceImpl pastorService;


    @Test
    void shouldGetPastorById() {
        Church church = Church.builder().id(1L).name("MAIN CHURCH").build();
        PastorRole pastorRole = PastorRole.builder().id(1L).name("Lead Pastor").build();
        Member member = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .middleName("M")
                .emailAddress("john@test.com")
                .gender(Gender.MALE)
                .build();
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(member)
                .church(church)
                .pastorRole(pastorRole)
                .build();

        when(pastorRepository.findById(1L)).thenReturn(Optional.of(pastor));

        PastorResponse result = pastorService.getPastorById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John", result.getFirstName());
    }

    @Test
    void shouldThrowExceptionWhenPastorNotFound() {
        when(pastorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> pastorService.getPastorById(99L));
    }

    @Test
    void shouldThrowExceptionWhenIdIsNull() {
        assertThrows(IllegalArgumentException.class, () -> pastorService.getPastorById(null));
    }

    @Test
    void shouldGetAllPastors() {
        Church church = Church.builder().id(1L).name("MAIN CHURCH").build();
        PastorRole pastorRole = PastorRole.builder().id(1L).name("Lead Pastor").build();
        Member member = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .middleName("M")
                .emailAddress("john@test.com")
                .gender(Gender.MALE)
                .build();
        Pastor pastor = Pastor.builder()
                .id(1L)
                .member(member)
                .church(church)
                .pastorRole(pastorRole)
                .build();

        PageRequest pageable = PageRequest.of(0, 20);
        Page<Pastor> pastorPage = new PageImpl<>(List.of(pastor));

        when(pastorRepository.findAll(pageable)).thenReturn(pastorPage);

        Page<PastorResponse> result = pastorService.getPastors(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }


    @Test
    void shouldThrowExceptionOnUpdateWhenIdIsNull() {
        PastorRequest request = PastorRequest.builder().memberId(1L).build();

        assertThrows(IllegalArgumentException.class, () -> pastorService.updatePastor(null, request));
    }

    @Test
    void shouldSoftDeletePastor() {
        Long pastorId = 1L;
        Member member = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .gender(Gender.MALE)
                .build();
        Pastor pastor = Pastor.builder()
                .id(pastorId)
                .member(member)
                .build();

        when(pastorRepository.findById(pastorId)).thenReturn(Optional.of(pastor));
        when(pastorRepository.save(any(Pastor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        pastorService.deletePastorById(pastorId);

        assertTrue(pastor.isDeleted());
        verify(pastorRepository).save(pastor);
    }

    @Test
    void shouldThrowExceptionOnDeleteWhenIdIsNull() {
        assertThrows(IllegalArgumentException.class, () -> pastorService.deletePastorById(null));
    }

    @Test
    void shouldThrowExceptionWhenUpdatingNonExistentPastor() {
        when(pastorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> pastorService.updatePastor(99L, PastorRequest.builder().build()));
    }

    @Test
    void shouldCreatePastorWithChurchAndRole() {
        Church church = Church.builder().id(1L).name("MAIN CHURCH").build();
        PastorRole pastorRole = PastorRole.builder().id(1L).name("Lead Pastor").build();

        when(churchService.findChurchById(1L)).thenReturn(church);
        when(pastorRoleService.findPastorRole(1L)).thenReturn(pastorRole);

        when(pastorRepository.save(any(Pastor.class))).thenAnswer(invocation -> {
            Pastor p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        PastorRequest request = PastorRequest.builder()
                .churchId(1L).pastorRoleId(1L).memberId(10L)
                .build();

        Member member = Member.builder()
                .id(10L).firstName("John").lastName("Doe")
                .gender(Gender.MALE).tel("1234567890")
                .build();

        when(memberService.findMemberById(10L)).thenReturn(member);

        PastorResponse result = pastorService.createPastor(request);

        assertNotNull(result);
        verify(memberService).findMemberById(10L);
        verify(pastorRepository).save(any(Pastor.class));
    }

    @Test
    void shouldCreatePastorWithoutChurchAndRole() {
        Church church = Church.builder().id(1L).name("MAIN CHURCH").build();
        PastorRole pastorRole = PastorRole.builder().id(1L).name("Lead Pastor").build();

        when(churchService.findChurchById(1L)).thenReturn(church);
        when(pastorRoleService.findPastorRole(1L)).thenReturn(pastorRole);

        Member member = Member.builder()
                .id(10L).firstName("John").lastName("Doe")
                .gender(Gender.MALE).tel("1234567890")
                .build();
        when(memberService.findMemberById(10L)).thenReturn(member);
        when(pastorRepository.save(any(Pastor.class))).thenAnswer(invocation -> {
            Pastor p = invocation.getArgument(0);
            p.setId(2L);
            return p;
        });

        PastorRequest request = PastorRequest.builder()
                .churchId(1L).pastorRoleId(1L).memberId(10L)
                .build();

        PastorResponse result = pastorService.createPastor(request);

        assertNotNull(result);
        assertNotNull(result.getChurch());
        assertNotNull(result.getPastorRole());
    }

    @Test
    void shouldUpdatePastorWithAllFields() {
        Church oldChurch = Church.builder().id(1L).name("OLD CHURCH").build();
        Church newChurch = Church.builder().id(2L).name("NEW CHURCH").build();
        PastorRole oldRole = PastorRole.builder().id(1L).name("Old Role").build();
        PastorRole newRole = PastorRole.builder().id(2L).name("New Role").build();
        Member member = Member.builder()
                .id(10L).firstName("John").lastName("Doe")
                .gender(Gender.MALE).tel("1234567890")
                .build();
        Pastor existingPastor = Pastor.builder()
                .id(1L).member(member).church(oldChurch).pastorRole(oldRole)
                .build();

        when(pastorRepository.findById(1L)).thenReturn(Optional.of(existingPastor));
        when(churchService.findChurchById(2L)).thenReturn(newChurch);
        when(pastorRoleService.findPastorRole(2L)).thenReturn(newRole);

        when(pastorRepository.save(any(Pastor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PastorRequest request = PastorRequest.builder()
                .churchId(2L).pastorRoleId(2L).memberId(10L)
                .build();

        PastorResponse result = pastorService.updatePastor(1L, request);

        assertNotNull(result);
        verify(pastorRepository).save(any(Pastor.class));
    }

    @Test
    void shouldUpdatePastorWithoutChangingChurchOrRole() {
        Church church = Church.builder().id(1L).name("CHURCH").build();
        PastorRole role = PastorRole.builder().id(1L).name("Role").build();
        Member member = Member.builder()
                .id(10L).firstName("John").lastName("Doe")
                .gender(Gender.MALE).tel("1234567890")
                .build();
        Pastor existingPastor = Pastor.builder()
                .id(1L).member(member).church(church).pastorRole(role)
                .build();

        when(pastorRepository.findById(1L)).thenReturn(Optional.of(existingPastor));
        when(churchService.findChurchById(1L)).thenReturn(church);
        when(pastorRoleService.findPastorRole(1L)).thenReturn(role);

        when(pastorRepository.save(any(Pastor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PastorRequest request = PastorRequest.builder()
                .churchId(1L).pastorRoleId(1L).memberId(10L)
                .build();

        PastorResponse result = pastorService.updatePastor(1L, request);

        assertNotNull(result);
        verify(churchService).findChurchById(1L);
        verify(pastorRoleService).findPastorRole(1L);
    }

    @Test
    void shouldThrowExceptionOnDeleteWhenPastorNotFound() {
        when(pastorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> pastorService.deletePastorById(99L));
    }
}
