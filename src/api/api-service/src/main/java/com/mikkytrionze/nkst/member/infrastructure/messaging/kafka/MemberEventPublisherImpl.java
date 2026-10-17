package com.mikkytrionze.nkst.member.infrastructure.messaging.kafka;

import com.mikkytrionze.member.application.dto.MemberCreatedEvent;
import com.mikkytrionze.nkst.member.domain.gateway.MemberEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberEventPublisherImpl implements MemberEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    @Value("${spring.kafka.topic.member-created}")
    private String memberCreatedTopic;

    @Override
    public void publishMemberCreated(MemberCreatedEvent memberCreatedEvent) {
        log.info("Infrastructure: Publishing MemberCreatedEvent to kafka. Member ID: {}", memberCreatedEvent.getMemberId());

        try {
            kafkaTemplate.send(memberCreatedTopic, memberCreatedEvent.getMemberId().toString(), memberCreatedEvent);
            log.info("Infrastructure: Event published successfully!");
        } catch (Exception e) {
            log.error("Infrastructure: Failed to publish event to kafka", e);
            throw new RuntimeException("messaging failed!", e);
        }
    }
}
