package com.mikkytrionze.announcement.application.service;

import com.mikkytrionze.announcement.api.request.CreateAnnouncementRequest;
import com.mikkytrionze.announcement.api.response.AnnouncementResponse;
import com.mikkytrionze.announcement.domain.grpc.ChurchGrpcClient;
import com.mikkytrionze.announcement.domain.model.Announcement;
import com.mikkytrionze.announcement.domain.repository.AnnouncementRepository;
import com.mikkytrionze.announcement.security.ScopeService;
import com.mikkytrionze.proto.church.GetChurchResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceScopeTest {

    @Mock AnnouncementRepository repository;
    @Mock ChurchGrpcClient churchGrpcClient;
    @Mock ScopeService scopeService;
    AnnouncementServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AnnouncementServiceImpl(repository, scopeService, churchGrpcClient);
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer tok");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
    }
    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); RequestContextHolder.resetRequestAttributes(); }

    private Announcement ann(long id, long churchId) {
        return Announcement.builder().id(id).churchId(churchId).churchName("C"+churchId).title("T"+id).content("c").priority(com.mikkytrionze.announcement.domain.model.Priority.LOW).rolesAllowed(List.of("ROLE_MEMBER")).expiresAt(LocalDateTime.now().plusDays(1)).deleted(false).build();
    }

    @Test
    void createAnnouncement_deniesOutOfScopeChurch() {
        var auth = new UsernamePasswordAuthenticationToken("u","n");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(churchGrpcClient.getChurchByToken("tok")).thenReturn(GetChurchResponse.newBuilder().setChurchId(2L).setChurchName("C2").build());
        when(scopeService.canAccessChurch(auth, 2L)).thenReturn(false);
        CreateAnnouncementRequest req = new CreateAnnouncementRequest(); req.setTitle("t"); req.setContent("c"); req.setPriority(com.mikkytrionze.announcement.domain.model.Priority.LOW); req.setRolesAllowed(List.of("ROLE_MEMBER")); req.setExpiresAt(LocalDateTime.now().plusDays(1));

        assertThrows(AccessDeniedException.class, () -> service.createAnnouncement(req, auth));
        verify(repository, never()).save(any());
    }

    @Test
    void fetchAnnouncements_filtersToScopedChurchesForNonSuperAdmin() {
        var auth = new UsernamePasswordAuthenticationToken("u","n");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(scopeService.isSuperAdmin(auth)).thenReturn(false);
        when(scopeService.scopedChurchIds(auth)).thenReturn(List.of(1L));
        Page<Announcement> page = new PageImpl<>(List.of(ann(1,1), ann(2,2)), PageRequest.of(0,10), 2);
        when(repository.findAll(any(PageRequest.class))).thenReturn(page);

        Page<AnnouncementResponse> result = service.fetchAnnouncements(PageRequest.of(0,10), auth);
        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getContent().get(0).getId());
    }

    @Test
    void findById_deniesOutOfScopeChurch() {
        var auth = new UsernamePasswordAuthenticationToken("u","n");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(repository.findById(9L)).thenReturn(Optional.of(ann(9,9L)));
        when(scopeService.canAccessChurch(auth, 9L)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> service.findById(9L, auth));
    }

    @Test
    void superAdminCanReadAllAnnouncements() {
        var auth = new UsernamePasswordAuthenticationToken("sa","n");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(scopeService.isSuperAdmin(auth)).thenReturn(true);
        Page<Announcement> page = new PageImpl<>(List.of(ann(1,1), ann(2,2)), PageRequest.of(0,10), 2);
        when(repository.findAll(any(PageRequest.class))).thenReturn(page);

        Page<AnnouncementResponse> result = service.fetchAnnouncements(PageRequest.of(0,10), auth);
        assertEquals(2, result.getContent().size());
    }
}
