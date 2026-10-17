package com.mikkytrionze.nkst.profile.api;

import com.mikkytrionze.nkst.profile.api.request.ProfileRequest;
import com.mikkytrionze.nkst.profile.api.response.ProfileResponse;
import com.mikkytrionze.nkst.profile.domain.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        var response = profileService.getProfile();
        return ResponseEntity.ok().body(response);
    }

    @PostMapping
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody ProfileRequest profileRequest) {
        var response = profileService.updateProfile(profileRequest);
        return ResponseEntity.ok().body(response);
    }
}
