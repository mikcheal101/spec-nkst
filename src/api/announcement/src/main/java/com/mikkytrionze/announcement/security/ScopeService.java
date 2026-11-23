package com.mikkytrionze.announcement.security;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScopeService {
    private final JdbcTemplate jdbc;
    public ScopeService(ObjectProvider<JdbcTemplate> provider) { this.jdbc = provider.getIfAvailable(); }

    public boolean isSuperAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()) || "SUPER_ADMIN".equals(a.getAuthority()));
    }

    public List<Long> scopedChurchIds(Authentication auth) {
        if (jdbc == null || auth == null) return List.of();
        try {
            Long userId = jdbc.query("select id from users where username = ?", ps -> ps.setString(1, auth.getName()), rs -> rs.next() ? rs.getLong(1) : null);
            if (userId == null) return List.of();
            return jdbc.queryForList("select church_id from user_church_scopes where user_id = ?", Long.class, userId);
        } catch (Exception e) { return List.of(); }
    }

    public boolean canAccessChurch(Authentication auth, Long churchId) {
        if (isSuperAdmin(auth)) return true;
        if (churchId == null) return false;
        return scopedChurchIds(auth).contains(churchId);
    }
}
