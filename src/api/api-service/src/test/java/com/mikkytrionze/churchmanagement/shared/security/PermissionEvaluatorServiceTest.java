package com.mikkytrionze.churchmanagement.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PermissionEvaluatorServiceTest {

    private final PermissionEvaluatorService evaluator = new PermissionEvaluatorService();

    @Test
    void has_allowsCanonicalResourceAction() {
        var auth = new UsernamePasswordAuthenticationToken("u", "n", List.of(new SimpleGrantedAuthority("CHURCH:VIEW")));
        assertTrue(evaluator.has(auth, "CHURCH", "VIEW"));
    }

    @Test
    void has_allowsLegacyUppercaseAlias() {
        var auth = new UsernamePasswordAuthenticationToken("u", "n", List.of(new SimpleGrantedAuthority("CAN_VIEW_CHURCH")));
        assertTrue(evaluator.has(auth, "CHURCH", "VIEW"));
    }

    @Test
    void has_allowsLegacyLowercaseAlias() {
        var auth = new UsernamePasswordAuthenticationToken("u", "n", List.of(new SimpleGrantedAuthority("can_view_church")));
        assertTrue(evaluator.has(auth, "CHURCH", "VIEW"));
    }

    @Test
    void has_deniesWhenMissingPermission() {
        var auth = new UsernamePasswordAuthenticationToken("u", "n", List.of(new SimpleGrantedAuthority("MEMBER:VIEW")));
        assertFalse(evaluator.has(auth, "CHURCH", "UPDATE"));
    }

    @Test
    void has_allowsSuperAdminRole() {
        var auth = new UsernamePasswordAuthenticationToken("u", "n", List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        assertTrue(evaluator.has(auth, "ANY", "DELETE"));
    }

    @Test
    void has_returnsFalseForNullAuthentication() {
        assertFalse(evaluator.has(null, "CHURCH", "VIEW"));
    }
}
