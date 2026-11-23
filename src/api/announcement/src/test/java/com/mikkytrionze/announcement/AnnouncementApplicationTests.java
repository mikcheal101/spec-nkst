package com.mikkytrionze.announcement;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest(properties = {
	"spring.autoconfigure.exclude=net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.ObservationAutoConfiguration,org.springframework.boot.actuate.autoconfigure.observation.web.servlet.WebMvcObservationAutoConfiguration"
})
@Import(TestInfraConfig.class)
class AnnouncementApplicationTests {

	@Test
	void contextLoads() {
	}

}
