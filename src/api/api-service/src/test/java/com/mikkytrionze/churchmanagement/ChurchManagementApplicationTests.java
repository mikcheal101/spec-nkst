package com.mikkytrionze.churchmanagement;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Import(TestCacheConfig.class)
class ChurchManagementApplicationTests {

    @Test
    void contextLoads() {
    }

    @Test
    void mainMethodShouldStartApplication() {
        try (ConfigurableApplicationContext ctx = new SpringApplicationBuilder(ChurchManagementApplication.class, TestCacheConfig.class)
                .properties(
                        "server.port=0",
                        "spring.datasource.url=jdbc:h2:mem:testmain;DB_CLOSE_DELAY=-1;MODE=MYSQL",
                        "spring.datasource.driver-class-name=org.h2.Driver",
                        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                        "spring.jpa.hibernate.ddl-auto=create-drop"
                )
                .run()) {
            assertNotNull(ctx);
            assertNotNull(ctx.getBean(ChurchManagementApplication.class));
        }
    }
}
