package com.mikkytrionze.nkst.deacon.domain.repository;

import com.mikkytrionze.nkst.deacon.domain.model.Deacon;
import com.mikkytrionze.nkst.member.domain.model.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeaconRepository extends JpaRepository<Deacon, Long> {

    Optional<Deacon> findByIdAndChurchId(Long id, Long churchId);

    @Query("SELECT d.member FROM Deacon d WHERE d.church.id = :id")
    Page<Member> findAllByChurchId(@Param("id") Long id, Pageable pageable);

    @Query("SELECT d.member FROM Deacon d WHERE d.church.id = :churchId AND d.member.id = :id")
    Optional<Member> findByChurchId(@Param("churchId") Long churchId, @Param("id") Long id);

    @Query("SELECT m FROM Member m " +
            "WHERE m.church.id = :churchId " +
            "AND (" +
            "  LOWER(m.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "  LOWER(m.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "  LOWER(m.middleName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "  LOWER(m.tel) LIKE LOWER(CONCAT('%', :query, '%'))" +
            ") " +
            "AND m.id NOT IN (" +
            "  SELECT d.member.id FROM Deacon d WHERE d.church.id = :churchId" +
            ")")
    Page<Member> searchEligibleMembers(
            @Param("churchId") Long churchId,
            @Param("query") String query,
            Pageable pageable);
}
