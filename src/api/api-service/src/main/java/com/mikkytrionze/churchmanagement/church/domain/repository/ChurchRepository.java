package com.mikkytrionze.churchmanagement.church.domain.repository;

import com.mikkytrionze.churchmanagement.church.domain.model.Church;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChurchRepository extends JpaRepository<Church, Long> {
    Boolean existsByName(String name);
    Page<Church> findByParentChurchId(Long parentChurchId, Pageable pageable);
}
