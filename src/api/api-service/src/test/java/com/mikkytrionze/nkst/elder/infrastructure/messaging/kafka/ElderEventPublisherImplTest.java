package com.mikkytrionze.nkst.elder.infrastructure.messaging.kafka;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;
import com.mikkytrionze.nkst.shared.exception.KafkaMessagingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ElderEventPublisherImplTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private ElderEventPublisherImpl publisher;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(publisher, "elderCreatedTopic", "elder-created-topic");
    }

    @Test
    void shouldPublishElderCreatedEvent() {
        ElderCreatedEvent event = ElderCreatedEvent.builder()
                .elderId(1L)
                .memberId(1L)
                .userId(1L)
                .activate(true)
                .build();

        publisher.publishElderCreated(event);

        verify(kafkaTemplate).send("elder-created-topic", "1", event);
    }

    @Test
    void shouldThrowKafkaMessagingExceptionWhenKafkaSendFails() {
        ElderCreatedEvent event = ElderCreatedEvent.builder()
                .elderId(1L)
                .memberId(1L)
                .userId(1L)
                .activate(true)
                .build();

        when(kafkaTemplate.send("elder-created-topic", "1", event))
                .thenThrow(new RuntimeException("boom"));

        KafkaMessagingException ex = assertThrows(KafkaMessagingException.class,
                () -> publisher.publishElderCreated(event));

        assertEquals("Kafka: Messaging failed!", ex.getMessage());
        assertNotNull(ex.getCause());
        assertEquals("boom", ex.getCause().getMessage());
    }
}
