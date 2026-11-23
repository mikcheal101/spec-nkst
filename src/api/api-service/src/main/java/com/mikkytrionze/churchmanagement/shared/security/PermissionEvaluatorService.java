package com.mikkytrionze.churchmanagement.shared.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component("perm")
public class PermissionEvaluatorService {
    public boolean has(Authentication authentication, String resource, String action) {
        if (authentication == null) return false;
        Set<String> auths = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).filter(a -> a != null).collect(Collectors.toSet());
        String canonical = (resource + ":" + action).toUpperCase(Locale.ROOT);
        String legacy = ("CAN_" + action + "_" + resource).toUpperCase(Locale.ROOT);
        String legacyLower = legacy.toLowerCase(Locale.ROOT);
        return auths.contains(canonical) || auths.contains(legacy) || auths.contains(legacyLower)
                || auths.contains("ROLE_SUPER_ADMIN") || auths.contains("SUPER_ADMIN");
    }
}
