package com.mikkytrionze.auth.user.api;

import com.mikkytrionze.auth.user.application.service.UserGovernanceService;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.role.application.dto.ERole;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserGovernanceController {
    private final UserGovernanceService userGovernanceService;

    @GetMapping
    @PreAuthorize("hasAuthority('MEMBERS:READ') or hasAuthority('MEMBERS:VIEW') or hasAuthority('can_view_members') or hasAuthority('SETTINGS:READ') or hasAuthority('can_read_settings')")
    public ResponseEntity<List<UserGovernanceService.ManagedUserResponse>> listUsers() {
        return ResponseEntity.ok(userGovernanceService.listUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MEMBERS:READ') or hasAuthority('MEMBERS:VIEW') or hasAuthority('can_view_members') or hasAuthority('SETTINGS:READ') or hasAuthority('can_read_settings')")
    public ResponseEntity<UserGovernanceService.ManagedUserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userGovernanceService.getUser(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MEMBERS:CREATE') or hasAuthority('can_create_members') or hasAuthority('SETTINGS:UPDATE') or hasAuthority('can_update_settings')")
    public ResponseEntity<UserGovernanceService.ManagedUserResponse> provisionUser(@RequestBody Map<String, Object> body) {
        String username = body.get("username") == null ? null : String.valueOf(body.get("username"));
        String password = body.get("password") == null ? null : String.valueOf(body.get("password"));
        String statusRaw = body.get("status") == null ? null : String.valueOf(body.get("status"));
        AccountStatus status = statusRaw == null || statusRaw.isBlank() ? AccountStatus.ACTIVE : AccountStatus.valueOf(statusRaw);
        @SuppressWarnings("unchecked")
        Set<ERole> roles = body.get("roles") instanceof java.util.Collection<?> c
                ? c.stream().map(String::valueOf).map(ERole::valueOf).collect(java.util.stream.Collectors.toSet())
                : Set.of();
        return ResponseEntity.ok(userGovernanceService.provisionUser(username, password, roles, status));
    }

    @PostMapping("/{id}/roles/{role}")
    @PreAuthorize("hasAuthority('ROLES:UPDATE') or hasAuthority('can_update_roles')")
    public ResponseEntity<Void> assignRole(@PathVariable Long id, @PathVariable ERole role, @RequestBody(required = false) Map<String,String> body) {
        userGovernanceService.assignRole(id, role, body == null ? null : body.get("stepUpToken"));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/roles/{role}")
    @PreAuthorize("hasAuthority('ROLES:UPDATE') or hasAuthority('can_update_roles')")
    public ResponseEntity<Void> revokeRole(@PathVariable Long id, @PathVariable ERole role, @RequestBody(required = false) Map<String,String> body) {
        userGovernanceService.revokeRole(id, role, body == null ? null : body.get("stepUpToken"));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('MEMBERS:UPDATE') or hasAuthority('can_update_members') or hasAuthority('SETTINGS:UPDATE') or hasAuthority('can_update_settings')")
    public ResponseEntity<Void> setStatus(@PathVariable Long id, @RequestBody Map<String,String> body) {
        AccountStatus status = AccountStatus.valueOf(body.get("status"));
        userGovernanceService.setAccountStatus(id, status, body.get("stepUpToken"));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('PERMISSIONS:UPDATE') or hasAuthority('can_update_permissions')")
    public ResponseEntity<Void> setDirectPermissions(@PathVariable Long id, @RequestBody Map<String,Object> body) {
        @SuppressWarnings("unchecked")
        Set<String> keys = body.get("permissions") instanceof java.util.Collection<?> c ? c.stream().map(String::valueOf).collect(java.util.stream.Collectors.toSet()) : Set.of();
        boolean policyEnabled = Boolean.parseBoolean(String.valueOf(body.getOrDefault("policyEnabled","false")));
        userGovernanceService.setDirectPermissions(id, keys, policyEnabled, String.valueOf(body.get("stepUpToken")));
        return ResponseEntity.noContent().build();
    }
}
