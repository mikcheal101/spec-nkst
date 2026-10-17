package com.mikkytrionze.nkst.churchAdmin.infrastructure.messaging.kafka;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.nkst.shared.exception.KafkaMessagingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ChurchAdminEventPublisherImplTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private ChurchAdminEventPublisherImpl publisher;

    @BeforeEach
    void setUp() {
        publisher = new ChurchAdminEventPublisherImpl(kafkaTemplate);
        ReflectionTestUtils.setField(publisher, "churchAdminUpdatedEventTopic", "church-admin-updated-topic");
    }

    @Test
    void shouldPublishEvent_whenMemberIdPresent() {
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .activate(true)
                .churchId(5L)
                .memberId(100L)
                .build();

        publisher.publishChurchAdminUpdated(event);

        verify(kafkaTemplate).send("church-admin-updated-topic", "100", event);
    }

    @Test
    void shouldNotPublish_whenMemberIdIsNull() {
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .activate(true)
                .churchId(5L)
                .build();

        publisher.publishChurchAdminUpdated(event);

        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void shouldThrowKafkaMessagingException_whenSendFails() {
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .activate(true)
                .churchId(5L)
                .memberId(100L)
                .build();
        when(kafkaTemplate.send(eq("church-admin-updated-topic"), eq("100"), eq(event)))
                .thenThrow(new RuntimeException("kafka is down"));

        assertThrows(KafkaMessagingException.class, () -> publisher.publishChurchAdminUpdated(event));
    }
}
