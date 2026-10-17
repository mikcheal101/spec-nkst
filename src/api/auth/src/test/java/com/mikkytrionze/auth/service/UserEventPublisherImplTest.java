package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.user.infrastructure.messaging.kafka.UserEventPublisherImpl;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserEventPublisherImplTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private UserEventPublisherImpl userEventPublisherImpl;

    @Test
    void publishUserUpdatedEvent_sendsToKafka() {
        ReflectionTestUtils.setField(userEventPublisherImpl, "userUpdatedTopic", "user-updated-topic");
        UserUpdatedEvent event = UserUpdatedEvent.builder()
                .memberId(1L)
                .userId(2L)
                .build();

        userEventPublisherImpl.publishUserUpdatedEvent(event);

        verify(kafkaTemplate).send("user-updated-topic", "2", event);
    }

    @Test
    void publishUserUpdatedEvent_whenExceptionThrown_logsError() {
        ReflectionTestUtils.setField(userEventPublisherImpl, "userUpdatedTopic", "user-updated-topic");
        UserUpdatedEvent event = UserUpdatedEvent.builder()
                .memberId(1L)
                .userId(2L)
                .build();
        when(kafkaTemplate.send(anyString(), anyString(), any())).thenThrow(new RuntimeException("Kafka error"));

        userEventPublisherImpl.publishUserUpdatedEvent(event);

        verify(kafkaTemplate).send("user-updated-topic", "2", event);
    }
}
