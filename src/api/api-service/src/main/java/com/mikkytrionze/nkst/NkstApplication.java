package com.mikkytrionze.nkst;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.kafka.annotation.EnableKafka;

@EnableKafka
@EnableCaching
@EnableJpaAuditing
@SpringBootApplication
public class NkstApplication {

	public static void main(String[] args) {
		SpringApplication.run(NkstApplication.class, args);
	}

}
