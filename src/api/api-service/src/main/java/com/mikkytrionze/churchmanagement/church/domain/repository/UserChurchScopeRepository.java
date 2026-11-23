package com.mikkytrionze.churchmanagement.church.domain.repository;
import com.mikkytrionze.churchmanagement.church.domain.model.UserChurchScope;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UserChurchScopeRepository extends JpaRepository<UserChurchScope, Long> {
    boolean existsByUserIdAndChurchId(Long userId, Long churchId);
    List<UserChurchScope> findByUserId(Long userId);
}
