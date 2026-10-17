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

        // check if it is a unique name
        Optional<Permission> fetchedPermission = permissionRepository.findByName(permission.getName());

        if (fetchedPermission.isPresent()) {
            log.info("Found a matching permission with name: {}", permission.getName());
            return fetchedPermission.get();
        }

        log.info("Creating a new permission by name: {}", permission.getName());
        return permissionRepository.saveAndFlush(permission);
    }

    @Override
    public Optional<Permission> findByName(String name) {
        return permissionRepository.findByName(name);
    }
}
