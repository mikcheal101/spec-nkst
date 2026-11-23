package com.mikkytrionze.churchmanagement.church.api;

import com.mikkytrionze.churchmanagement.church.domain.model.Church;
import com.mikkytrionze.churchmanagement.church.domain.model.UserChurchScope;
import com.mikkytrionze.churchmanagement.church.domain.repository.ChurchRepository;
import com.mikkytrionze.churchmanagement.church.domain.repository.UserChurchScopeRepository;
import com.mikkytrionze.churchmanagement.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/{userId}/church-scopes")
@RequiredArgsConstructor
public class UserChurchScopeController {
    private final UserChurchScopeRepository scopeRepository;
    private final ChurchRepository churchRepository;

    @GetMapping
    @PreAuthorize("@perm.has(authentication,'CHURCH','VIEW')")
    public List<Map<String,Object>> list(@PathVariable Long userId) {
        return scopeRepository.findByUserId(userId).stream()
                .map(s -> Map.<String,Object>of("id", s.getId(), "userId", s.getUserId(), "churchId", s.getChurch().getId(), "churchName", s.getChurch().getName()))
                .toList();
    }

    @PostMapping
    @PreAuthorize("@perm.has(authentication,'CHURCH','UPDATE')")
    public ResponseEntity<?> add(@PathVariable Long userId, @RequestBody Map<String,Long> body) {
        Long churchId = body.get("churchId");
        Church church = churchRepository.findById(churchId).orElseThrow(() -> new ResourceNotFoundException("Church", churchId));
        if (scopeRepository.existsByUserIdAndChurchId(userId, churchId)) return ResponseEntity.noContent().build();
        scopeRepository.save(UserChurchScope.builder().userId(userId).church(church).build());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{churchId}")
    @PreAuthorize("@perm.has(authentication,'CHURCH','UPDATE')")
    public ResponseEntity<Void> remove(@PathVariable Long userId, @PathVariable Long churchId) {
        scopeRepository.findByUserId(userId).stream().filter(s -> s.getChurch().getId().equals(churchId)).forEach(scopeRepository::delete);
        return ResponseEntity.noContent().build();
    }
}
