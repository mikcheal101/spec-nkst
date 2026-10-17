package com.mikkytrionze.nkst.churchAdmin.infrastructure.messaging.kafka;

import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.nkst.churchAdmin.domain.gateway.ChurchAdminEventPublisher;
import com.mikkytrionze.nkst.shared.exception.KafkaMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChurchAdminEventPublisherImpl implements ChurchAdminEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${spring.kafka.topic.church-admin-updated}")
    private String churchAdminUpdatedEventTopic;

    @Override
    public void publishChurchAdminUpdated(ChurchAdminUpdatedEvent churchAdminUpdatedEvent) {
        log.info("Infrastructure: Publishing ChurchAdminUpdatedEvent to kafka. Member ID: {}",
                churchAdminUpdatedEvent.getMemberId());

        if (churchAdminUpdatedEvent.getMemberId() == null) {
            log.warn("Infrastructure: Skipping publish — memberId is null");
            return;
        }

        try {
            kafkaTemplate.send(churchAdminUpdatedEventTopic,
                    churchAdminUpdatedEvent.getMemberId().toString(), churchAdminUpdatedEvent);
            log.info("Infrastructure: Event published successfully!");
        } catch (Exception e) {
            log.error("Infrastructure: Failed to publish event to kafka", e);
            throw new KafkaMessagingException(e);
        }
    }
}
