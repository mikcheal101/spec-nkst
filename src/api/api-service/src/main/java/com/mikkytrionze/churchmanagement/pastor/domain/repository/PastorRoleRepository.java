package com.mikkytrionze.churchmanagement.pastor.domain.repository;

import com.mikkytrionze.churchmanagement.pastor.domain.model.PastorRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PastorRoleRepository extends JpaRepository<PastorRole, Long> {
}
