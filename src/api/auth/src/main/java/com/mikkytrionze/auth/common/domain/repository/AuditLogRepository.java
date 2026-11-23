package com.mikkytrionze.auth.common.domain.repository;

import com.mikkytrionze.auth.common.domain.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
}
