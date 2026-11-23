package com.mikkytrionze.auth.roles.domain.service;

import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.common.domain.service.SaveAble;

import java.util.Optional;

public interface PermissionService extends SaveAble<Permission> {
    Optional<Permission> findByName(String name);
    Optional<Permission> findByKey(String key);
    Optional<Permission> findByLegacyAlias(String legacyAlias);
    Optional<Permission> findByCanonical(String resource, String action);
}
