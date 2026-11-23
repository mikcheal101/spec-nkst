package com.mikkytrionze.auth.roles.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PermissionMatrixService {
    private final PermissionRepository permissionRepository;

    public Permission resolve(String keyOrAlias) {
        if (keyOrAlias == null || keyOrAlias.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "PERMISSION_INVALID", "Permission key required");
        String v = keyOrAlias.trim();
        return permissionRepository.findByKey(v)
                .or(() -> permissionRepository.findByLegacyAlias(v))
                .or(() -> permissionRepository.findByName(v))
                .or(() -> permissionRepository.findByKey(v.toUpperCase(Locale.ROOT)))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "PERMISSION_INVALID", "Unknown permission: " + v));
    }
}
