package com.mikkytrionze.auth.user.infrastructure.database.seed;

import java.util.List;
import java.util.Map;

public record CanonicalBaseline(
        String version,
        String capturedAt,
        Map<String, Object> source,
        List<UserSeed> users,
        List<RoleSeed> roles,
        List<PermissionSeed> permissions,
        List<RolePermissionSeed> rolePermissions,
        List<UserRoleSeed> userRoles,
        Map<String, Object> metadata
) {
    public record UserSeed(Long id, String username, String passwordHash, String accountStatus, Boolean isRootSuperAdmin, Integer permissionEpoch) {}
    public record RoleSeed(Long id, String name, String displayName, Boolean isSystem, Boolean isProtected, Boolean active) {}
    public record PermissionSeed(Long id, String key, String resource, String action, String legacyAlias, Boolean active) {}
    public record RolePermissionSeed(Long roleId, Long permissionId) {}
    public record UserRoleSeed(Long userId, Long roleId) {}
}
