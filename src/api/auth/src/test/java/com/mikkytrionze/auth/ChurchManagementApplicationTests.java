package com.mikkytrionze.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(properties = "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration")
class ChurchManagementApplicationTests {

    @Test
    void contextLoads() {
        ChurchManagementApplication app = new ChurchManagementApplication();
        assertNotNull(app);
    }
}
