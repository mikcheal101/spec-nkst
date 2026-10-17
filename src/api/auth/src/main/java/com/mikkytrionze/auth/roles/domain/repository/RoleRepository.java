package com.mikkytrionze.auth.roles.domain.repository;

import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.role.application.dto.ERole;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
}
