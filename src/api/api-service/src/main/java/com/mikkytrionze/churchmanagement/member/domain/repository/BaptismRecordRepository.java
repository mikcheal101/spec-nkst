package com.mikkytrionze.churchmanagement.member.domain.repository;

import com.mikkytrionze.churchmanagement.member.domain.model.BaptismRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BaptismRecordRepository extends JpaRepository<BaptismRecord, Long> {
}
