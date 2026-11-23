package com.mikkytrionze.churchmanagement.church.application.service;

import com.mikkytrionze.churchmanagement.church.api.request.ChurchRequest;
import com.mikkytrionze.churchmanagement.church.api.response.ChurchResponse;
import com.mikkytrionze.churchmanagement.church.domain.model.Church;
import com.mikkytrionze.churchmanagement.church.domain.repository.ChurchRepository;
import com.mikkytrionze.churchmanagement.shared.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChurchServiceScopeGovernanceTest {

    @Mock ChurchRepository churchRepository;
    @Mock SecurityUtils securityUtils;
    ChurchServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ChurchServiceImpl(churchRepository, securityUtils);
        SecurityContextHolder.clearContext();
    }

    @Test
    void getChurch_deniesWhenScopeMissing() {
        doThrow(new AccessDeniedException("Church scope denied")).when(securityUtils).assertChurchScope(5L);
        assertThrows(AccessDeniedException.class, () -> service.getChurch(5L));
        verify(churchRepository, never()).findById(any());
    }

    @Test
    void getChurches_filtersToExplicitScopesForNonSuperAdmin() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("u","n", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        Church a = Church.builder().id(1L).name("A").address("a").status("ACTIVE").build();
        Church b = Church.builder().id(2L).name("B").address("b").status("ACTIVE").build();
        when(churchRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(a,b), PageRequest.of(0,10), 2));
        when(securityUtils.hasChurchScope(1L)).thenReturn(true);
        when(securityUtils.hasChurchScope(2L)).thenReturn(false);

        Page<ChurchResponse> result = service.getChurches(PageRequest.of(0,10));
        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getContent().get(0).getId());
    }

    @Test
    void createChurch_rejectsInactiveParent() {
        Church parent = Church.builder().id(10L).name("P").address("p").status("SUSPENDED").build();
        when(churchRepository.findById(10L)).thenReturn(Optional.of(parent));
        ChurchRequest req = ChurchRequest.builder().name("Child").address("addr").parentChurchId(10L).build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.createChurch(req));
        assertTrue(ex.getMessage().contains("Parent church must be active"));
        verify(churchRepository, never()).save(any());
    }

    @Test
    void updateChurch_rejectsInvalidStatusTransition() {
        Church existing = Church.builder().id(1L).name("A").address("a").status("ARCHIVED").build();
        when(churchRepository.findById(1L)).thenReturn(Optional.of(existing));
        ChurchRequest req = ChurchRequest.builder().name("A").address("a").status("ACTIVE").build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.updateChurch(1L, req));
        assertTrue(ex.getMessage().contains("Invalid church status transition"));
    }

    @Test
    void updateChurch_appliesAllowedTransition() {
        Church existing = Church.builder().id(1L).name("A").address("a").status("ACTIVE").build();
        when(churchRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(churchRepository.existsByName("A")).thenReturn(true);
        when(churchRepository.save(any(Church.class))).thenAnswer(i -> i.getArgument(0));
        ChurchRequest req = ChurchRequest.builder().name("A").address("a2").status("SUSPENDED").build();

        service.updateChurch(1L, req);
        var captor = org.mockito.ArgumentCaptor.forClass(Church.class);
        verify(churchRepository).save(captor.capture());
        assertEquals("SUSPENDED", captor.getValue().getStatus());
    }
}
