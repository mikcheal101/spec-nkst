package com.mikkytrionze.auth.roles.application.service;

import com.mikkytrionze.auth.roles.api.request.RoleRequest;
import com.mikkytrionze.auth.roles.application.exception.RoleNotFoundException;
import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.repository.RoleRepository;
import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.application.mapper.RoleMapper;
import com.mikkytrionze.auth.roles.domain.service.PermissionService;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.role.application.dto.ERole;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final PermissionService permissionService;

    @Override
    public List<RolesResponse> fetchRoles() {
        return roleRepository.findAll()
                .stream()
                .map(roleMapper::toResponse)
                .toList();
    }

    @Override
    public Role saveObject(Role role) throws IllegalArgumentException {
        if (Objects.isNull(role)) {
            throw new IllegalArgumentException("Role cannot be null!");
        }

        // check if the object exists with similar name
        return roleRepository.findByName(role.getName())
                .map(existingRole -> {
                    log.info("Role with name: {} already exist!", existingRole.getName());
                    existingRole.setPermissions(role.getPermissions());
                    return roleRepository.save(existingRole);
                }).orElseGet(() -> {
                    log.info("Created a new role by name: {}", role.getName());
                    return roleRepository.saveAndFlush(role);
                });
    }

    @Override
    public Role updateObject(Role role) {
        if (Objects.isNull(role)) {
            throw new IllegalArgumentException("Role cannot be null!");
        }

        // check if the object exists with similar name
        Optional<Role> searchedRole = roleRepository.findByName(role.getName());

        if (searchedRole.isPresent()) {
            return roleRepository.save(role);
        }

        return role;
    }

    @Override
    public Optional<Role> findByName(ERole role) {
        return roleRepository.findByName(role);
    }

    @Override
    public RolesResponse getRoleById(final Long id) {
        Role fetchedRole = roleRepository.findById(id)
            .orElseThrow(() -> new RoleNotFoundException(null));
        return roleMapper.toResponse(fetchedRole);
    }

    @Override
    @Transactional
    public RolesResponse updateRole(final Long id, final RoleRequest request) {
        // check if the role exists
        Role fetchedRole = roleRepository.findById(id).orElseThrow(() -> new RoleNotFoundException(null));

        // fetch the permissions
        Set<Permission> permissions = request.getPermissions().stream()
                        .map(permission -> permissionService.findByName(permission).orElse(null))
                        .filter(permission -> permission != null)
                        .collect(Collectors.toSet());

        fetchedRole.setPermissions(permissions);
        Role updatedRole = roleRepository.save(fetchedRole);
        return roleMapper.toResponse(updatedRole);
    }

    @Override
    public void deleteRole(final Long id) {
        Role fetchedRole = roleRepository.findById(id).orElseThrow(() -> new RoleNotFoundException(null));
        roleRepository.delete(fetchedRole);
    }
}
