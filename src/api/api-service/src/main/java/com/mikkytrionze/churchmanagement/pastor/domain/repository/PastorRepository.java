package com.mikkytrionze.churchmanagement.pastor.domain.repository;

import com.mikkytrionze.churchmanagement.pastor.domain.model.Pastor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PastorRepository extends JpaRepository<Pastor, Long> {
}
