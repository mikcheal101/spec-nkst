package com.mikkytrionze.nkst.shared.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class SecurityUtilsTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private ChurchRepository churchRepository;

    @InjectMocks
    private SecurityUtils securityUtils;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String identifier) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(identifier, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void shouldReturnChurchForLoggedInUser() {
        Church church = Church.builder().id(2L).name("Main Church").address("Address").build();
        authenticate("user@x.com");
        when(memberRepository.findChurchIdByIdentifier("user@x.com")).thenReturn(Optional.of(2L));
        when(churchRepository.findById(2L)).thenReturn(Optional.of(church));

        Church result = securityUtils.getLoggedInUserChurch();

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("Main Church", result.getName());
    }

    @Test
    void shouldThrowResourceNotFoundException_whenChurchIdNotFoundForUser() {
        authenticate("user@x.com");
        when(memberRepository.findChurchIdByIdentifier("user@x.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> securityUtils.getLoggedInUserChurch());
    }

    @Test
    void shouldThrowResourceNotFoundException_whenChurchNotFound() {
        authenticate("user@x.com");
        when(memberRepository.findChurchIdByIdentifier("user@x.com")).thenReturn(Optional.of(2L));
        when(churchRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> securityUtils.getLoggedInUserChurch());
    }

    @Test
    void shouldThrowResourceNotFoundException_whenNoAuthentication_forChurch() {
        assertThrows(ResourceNotFoundException.class, () -> securityUtils.getLoggedInUserChurch());
    }

    @Test
    void shouldReturnMemberForLoggedInUser() {
        Member member = Member.builder()
                .id(1L)
                .tel("user@x.com")
                .firstName("John")
                .lastName("Doe")
                .build();
        authenticate("user@x.com");
        when(memberRepository.findByIdentifier("user@x.com")).thenReturn(Optional.of(member));

        Member result = securityUtils.getLoggedInUser();

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void shouldThrowResourceNotFoundException_whenMemberNotFoundForUser() {
        authenticate("user@x.com");
        when(memberRepository.findByIdentifier("user@x.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> securityUtils.getLoggedInUser());
    }

    @Test
    void shouldThrowResourceNotFoundException_whenNoAuthentication_forUser() {
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> securityUtils.getLoggedInUser());

        assertEquals("Authentication context is missing", exception.getMessage());
    }
}
