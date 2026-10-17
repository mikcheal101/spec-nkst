package com.mikkytrionze.auth.user.infrastructure.messaging.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.mikkytrionze.auth.user.domain.gateway.UserEventPublisher;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserEventPublisherImpl implements UserEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${spring.kafka.topic.user-updated}")
    private String userUpdatedTopic;

    @Override
    public void publishUserUpdatedEvent(UserUpdatedEvent userUpdatedEvent) {
        log.info("Publishing UserUpdatedEvent to Kafka topic: {}", userUpdatedTopic);

        try {
            kafkaTemplate.send(userUpdatedTopic, userUpdatedEvent.getUserId().toString(), userUpdatedEvent);
            log.info("UserUpdatedEvent published successfully, memberId {}, userId: {}", 
                userUpdatedEvent.getMemberId(), userUpdatedEvent.getUserId());
        } catch (Exception e) {
            log.error("Failed to publish UserUpdatedEvent: {}", userUpdatedEvent, e);
        }
    }

}
