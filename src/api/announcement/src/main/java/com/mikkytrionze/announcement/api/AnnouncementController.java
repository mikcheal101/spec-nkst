package com.mikkytrionze.announcement.api;

import com.mikkytrionze.announcement.api.request.CreateAnnouncementRequest;
import com.mikkytrionze.announcement.api.request.UpdateAnnouncementRequest;
import com.mikkytrionze.announcement.api.response.AnnouncementResponse;
import com.mikkytrionze.announcement.domain.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    @PreAuthorize("@perm.has(authentication, 'ANNOUNCEMENTS', 'VIEW')")
    public ResponseEntity<Page<AnnouncementResponse>> announcements(Pageable pageable, Authentication authentication) {
        var response = announcementService.fetchAnnouncements(pageable, authentication);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'ANNOUNCEMENTS', 'READ')")
    public ResponseEntity<AnnouncementResponse> announcement(@PathVariable("id") Long id, Authentication authentication) {
        var response = announcementService.findById(id, authentication);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping
    @PreAuthorize("@perm.has(authentication, 'ANNOUNCEMENTS', 'CREATE')")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(@Valid @RequestBody CreateAnnouncementRequest request, Authentication authentication) {
        var response = announcementService.createAnnouncement(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'ANNOUNCEMENTS', 'UPDATE')")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(@PathVariable("id") Long id, @RequestBody UpdateAnnouncementRequest request, Authentication authentication) {
        var response = announcementService.updateAnnouncement(id, request, authentication);
        return ResponseEntity.ok().body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has(authentication, 'ANNOUNCEMENTS', 'DELETE')")
    public ResponseEntity<Boolean> deleteAnnouncement(@PathVariable("id") Long id, Authentication authentication) {
        announcementService.deleteAnnouncement(id, authentication);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Boolean.TRUE);
    }
}
