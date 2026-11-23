package com.mikkytrionze.announcement.application.service;

import com.mikkytrionze.announcement.api.request.CreateAnnouncementRequest;
import com.mikkytrionze.announcement.api.request.UpdateAnnouncementRequest;
import com.mikkytrionze.announcement.api.response.AnnouncementResponse;
import com.mikkytrionze.announcement.domain.grpc.ChurchGrpcClient;
import com.mikkytrionze.announcement.domain.model.Announcement;
import com.mikkytrionze.announcement.domain.repository.AnnouncementRepository;
import com.mikkytrionze.announcement.domain.service.AnnouncementService;
import com.mikkytrionze.proto.church.GetChurchResponse;

import com.mikkytrionze.announcement.security.ScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;


@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final ScopeService scopeService;
    private final ChurchGrpcClient churchGrpcClient;

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> fetchAnnouncements(Pageable pageable, Authentication authentication) {
        log.info("Fetching paginated list of active announcements");
        var page = announcementRepository.findAll(pageable);
        if (scopeService.isSuperAdmin(authentication)) return page.map(this::mapToResponse);
        var allowed = scopeService.scopedChurchIds(authentication);
        var filtered = page.getContent().stream().filter(a -> a.getChurchId() != null && allowed.contains(a.getChurchId())).map(this::mapToResponse).toList();
        return new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
    }

    @Override
    @Transactional(readOnly = true)
    public AnnouncementResponse findById(Long id, Authentication authentication) throws ResourceNotFoundException {
        log.info("Fetching announcement with ID: {}", id);
        var announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + id));
        if (!scopeService.canAccessChurch(authentication, announcement.getChurchId())) throw new AccessDeniedException("Church scope denied");
        return mapToResponse(announcement);
    }

    @Override
    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, Authentication authentication) {
        log.info("Creating new announcement with title: {}", request.getTitle());

        String token = extractBearerToken();
        GetChurchResponse churchResponse = churchGrpcClient.getChurchByToken(token);

        Long churchId = churchResponse.getChurchId();
        String churchName = churchResponse.getChurchName();

        if (!scopeService.canAccessChurch(authentication, churchId)) throw new AccessDeniedException("Church scope denied");
        Announcement announcement = Announcement.builder()
                .churchId(churchId)
                .churchName(churchName)
                .title(request.getTitle())
                .content(request.getContent())
                .priority(request.getPriority())
                .rolesAllowed(request.getRolesAllowed())
                .expiresAt(request.getExpiresAt())
                .deleted(false)
                .build();

        Announcement savedAnnouncement = announcementRepository.save(announcement);
        log.info("Successfully created announcement with ID: {}", savedAnnouncement.getId());

        return mapToResponse(savedAnnouncement);
    }

    @Override
    @Transactional
    public AnnouncementResponse updateAnnouncement(Long id, UpdateAnnouncementRequest request, Authentication authentication) {
        log.info("Updating announcement with ID: {}", id);

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + id));
        if (!scopeService.canAccessChurch(authentication, announcement.getChurchId())) throw new AccessDeniedException("Church scope denied");
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setPriority(request.getPriority());
        announcement.setRolesAllowed(request.getRolesAllowed());
        announcement.setExpiresAt(request.getExpiresAt());

        Announcement updatedAnnouncement = announcementRepository.save(announcement);
        log.info("Successfully updated announcement with ID: {}", updatedAnnouncement.getId());

        return mapToResponse(updatedAnnouncement);
    }

    @Override
    @Transactional
    public void deleteAnnouncement(Long id, Authentication authentication) {
        log.info("Deleting announcement with ID: {}", id);

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + id));
        if (!scopeService.canAccessChurch(authentication, announcement.getChurchId())) throw new AccessDeniedException("Church scope denied");
        announcement.setDeleted(true);
        announcementRepository.save(announcement);

        log.info("Successfully marked announcement with ID: {} as deleted", id);
    }

    private AnnouncementResponse mapToResponse(Announcement announcement) {
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .priority(announcement.getPriority().name())
                .expiresAt(announcement.getExpiresAt())
                .build();
    }

    private String extractBearerToken() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            String bearerToken = attributes.getRequest().getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7);
            }
        }
        throw new IllegalStateException("Could not extract Bearer token from current request headers");
    }
}
