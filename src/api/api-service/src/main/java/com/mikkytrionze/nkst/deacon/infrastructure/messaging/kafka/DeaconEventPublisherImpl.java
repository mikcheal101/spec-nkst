package com.mikkytrionze.nkst.deacon.infrastructure.messaging.kafka;

import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;
import com.mikkytrionze.nkst.deacon.domain.gateway.DeaconEventPublisher;
import com.mikkytrionze.nkst.shared.exception.KafkaMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeaconEventPublisherImpl implements DeaconEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${spring.kafka.topic.deacon-created}")
    private String deaconCreatedTopic;

    @Override
    public void publishDeaconCreated(DeaconCreatedEvent event) {
        log.info("Publishing DeaconCreatedEvent for member ID: {} to topic: {}",
                event.getMemberId(), deaconCreatedTopic);

        try {
            // Publishing with the memberId as the key to ensure event ordering
            kafkaTemplate.send(deaconCreatedTopic, String.valueOf(event.getMemberId()), event);
            log.debug("Successfully published DeaconCreatedEvent.");
        } catch (Exception e) {
            log.error("Failed to publish DeaconCreatedEvent for member ID: {}", event.getMemberId(), e);
            throw new KafkaMessagingException(e);
        }
    }
}
