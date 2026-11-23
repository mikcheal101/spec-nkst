package com.mikkytrionze.churchmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.kafka.annotation.EnableKafka;

@EnableKafka
@EnableCaching
@EnableJpaAuditing
@SpringBootApplication
public class ChurchManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(ChurchManagementApplication.class, args);
	}

}
