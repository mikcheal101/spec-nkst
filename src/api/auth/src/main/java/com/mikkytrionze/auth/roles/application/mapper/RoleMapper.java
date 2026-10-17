package com.mikkytrionze.auth.roles.application.mapper;

import com.mikkytrionze.auth.roles.api.Response.RolesResponse;
import com.mikkytrionze.auth.roles.domain.model.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel="spring", uses = {PermissionMapper.class})
public interface RoleMapper {

    RolesResponse toResponse(Role role);
}
