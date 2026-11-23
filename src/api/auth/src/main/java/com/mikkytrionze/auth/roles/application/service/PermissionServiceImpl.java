package com.mikkytrionze.auth.roles.application.service;

import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;

    @Override
    public Permission saveObject(Permission permission) throws IllegalArgumentException {
        if (Objects.isNull(permission)) {
            throw new IllegalArgumentException("Permission cannot be null!");
        }

        Optional<Permission> fetchedPermission = Optional.empty();
        if (permission.getKey() != null && !permission.getKey().isBlank()) {
            fetchedPermission = permissionRepository.findByKey(permission.getKey());
        }
        if (fetchedPermission.isEmpty() && permission.getName() != null) {
            fetchedPermission = permissionRepository.findByName(permission.getName());
        }
        if (fetchedPermission.isEmpty() && permission.getLegacyAlias() != null) {
            fetchedPermission = permissionRepository.findByLegacyAlias(permission.getLegacyAlias());
        }

        if (fetchedPermission.isPresent()) {
            Permission existing = fetchedPermission.get();
            existing.setName(permission.getName() != null ? permission.getName() : existing.getName());
            existing.setKey(permission.getKey() != null ? permission.getKey() : existing.getKey());
            existing.setResource(permission.getResource() != null ? permission.getResource() : existing.getResource());
            existing.setAction(permission.getAction() != null ? permission.getAction() : existing.getAction());
            existing.setLegacyAlias(permission.getLegacyAlias() != null ? permission.getLegacyAlias() : existing.getLegacyAlias());
            existing.setActive(permission.isActive());
            return permissionRepository.save(existing);
        }

        log.info("Creating permission: {}", permission.getKey() != null ? permission.getKey() : permission.getName());
        return permissionRepository.saveAndFlush(permission);
    }

    @Override
    public Optional<Permission> findByName(String name) {
        Optional<Permission> byName = permissionRepository.findByName(name);
        if (byName.isPresent()) return byName;
        Optional<Permission> byAlias = permissionRepository.findByLegacyAlias(name);
        if (byAlias.isPresent()) return byAlias;
        return permissionRepository.findByKey(name);
    }

    @Override
    public Optional<Permission> findByKey(String key) {
        return permissionRepository.findByKey(key);
    }

    @Override
    public Optional<Permission> findByLegacyAlias(String legacyAlias) {
        return permissionRepository.findByLegacyAlias(legacyAlias);
    }

    @Override
    public Optional<Permission> findByCanonical(String resource, String action) {
        return permissionRepository.findByResourceAndAction(resource, action);
    }
}
