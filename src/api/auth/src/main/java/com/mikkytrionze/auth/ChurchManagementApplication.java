package com.mikkytrionze.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication(scanBasePackages = {"com.mikkytrionze.auth", "com.mikkytrionze.roles"})
@EnableKafka
public class ChurchManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(ChurchManagementApplication.class, args);
	}

}
