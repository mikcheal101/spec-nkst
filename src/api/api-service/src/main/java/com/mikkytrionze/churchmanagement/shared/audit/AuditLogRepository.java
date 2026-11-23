package com.mikkytrionze.churchmanagement.shared.audit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, String> {
    Page<AuditLogEntity> findByActionContainingIgnoreCase(String action, Pageable pageable);
}
