package com.mikkytrionze.auth.roles.application.mapper;

import org.mapstruct.Mapper;

import com.mikkytrionze.auth.roles.api.Response.PermissionResponse;
import com.mikkytrionze.auth.roles.domain.model.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    
    PermissionResponse toResponse(Permission permission);
}
