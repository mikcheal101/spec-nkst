package com.mikkytrionze.nkst.elder.infrastructure.messaging.kafka;

import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;
import com.mikkytrionze.nkst.elder.domain.gateway.ElderEventPublisher;
import com.mikkytrionze.nkst.shared.exception.KafkaMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElderEventPublisherImpl implements ElderEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${spring.kafka.topic.elder-created}")
    private String elderCreatedTopic;

    @Override
    public void publishElderCreated(ElderCreatedEvent event) {
        log.info("Publishing ElderCreatedEvent for member ID: {} to topic: {}",
                event.getMemberId(), elderCreatedTopic);

        try {
            // Publishing with the memberId as the key to ensure event ordering
            kafkaTemplate.send(elderCreatedTopic, String.valueOf(event.getMemberId()), event);
            log.debug("Successfully published ElderCreatedEvent.");
        } catch (Exception e) {
            log.error("Failed to publish ElderCreatedEvent for member ID: {}", event.getMemberId(), e);
            throw new KafkaMessagingException(e);
        }
    }
}
