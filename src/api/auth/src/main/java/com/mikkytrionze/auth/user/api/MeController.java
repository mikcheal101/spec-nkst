package com.mikkytrionze.auth.user.api;

import com.mikkytrionze.auth.roles.application.service.EffectivePermissionService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {
    private final EffectivePermissionService effectivePermissionService;
    private final UserRepository userRepository;

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, Object>> permissions(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        Set<String> permissions = effectivePermissionService.resolve(username);
        return ResponseEntity.ok(Map.of(
                "userId", String.valueOf(user.getId()),
                "permissionEpoch", user.getPermissionEpoch(),
                "roles", user.getRoles().stream().map(r -> r.getName().name()).toList(),
                "permissions", permissions
        ));
    }
}
