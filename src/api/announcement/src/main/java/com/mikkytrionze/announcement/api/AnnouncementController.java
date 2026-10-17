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
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<Page<AnnouncementResponse>> announcements(Pageable pageable) {
        var response = announcementService.fetchAnnouncements(pageable);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> announcement(@PathVariable("id") Long id) {
        var response = announcementService.findById(id);
        return ResponseEntity.ok().body(response);
    }

    @PostMapping
    public ResponseEntity<AnnouncementResponse> createAnnouncement(@Valid @RequestBody CreateAnnouncementRequest request) {
        var response = announcementService.createAnnouncement(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(@PathVariable("id") Long id, UpdateAnnouncementRequest request) {
        var response = announcementService.updateAnnouncement(id, request);
        return ResponseEntity.ok().body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteAnnouncement(@PathVariable("id") Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Boolean.TRUE);
    }
}
