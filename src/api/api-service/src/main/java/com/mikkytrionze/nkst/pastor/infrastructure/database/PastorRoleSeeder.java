package com.mikkytrionze.nkst.pastor.infrastructure.database;

import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;
import com.mikkytrionze.nkst.pastor.domain.repository.PastorRoleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Slf4j
@Configuration
public class PastorRoleSeeder {

    @Bean
    CommandLineRunner seedPastorRole(PastorRoleRepository pastorRoleRepository) {
        return args -> {
            if (pastorRoleRepository.count() == 0) {
                List.of("Senior Pastor",
                        "Associate Pastor",
                        "Youth Pastor",
                        "Children Pastor")
                        .stream()
                        .forEach(roleName -> pastorRoleRepository.save(PastorRole.builder().name(roleName).build()));

            }
        };
    }
}
