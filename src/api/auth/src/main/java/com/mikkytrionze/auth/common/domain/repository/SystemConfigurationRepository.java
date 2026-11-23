package com.mikkytrionze.auth.common.domain.repository;
import com.mikkytrionze.auth.common.domain.model.SystemConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SystemConfigurationRepository extends JpaRepository<SystemConfiguration, Long> {
    Optional<SystemConfiguration> findByConfigKey(String configKey);
}
