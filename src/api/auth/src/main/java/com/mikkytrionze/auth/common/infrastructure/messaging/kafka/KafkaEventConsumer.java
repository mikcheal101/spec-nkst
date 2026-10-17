package com.mikkytrionze.auth.common.infrastructure.messaging.kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.mikkytrionze.auth.common.application.service.KafkaEventHandler;
import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;
import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;
import com.mikkytrionze.member.application.dto.MemberCreatedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaEventConsumer {

    private final KafkaEventHandler kafkaEventHandler;

    @KafkaListener(topics = "${spring.kafka.topic.member-created}", groupId = "${spring.kafka.consumer-group-id}")
    public void consumeMemberCreatedEvent(MemberCreatedEvent event) {
        log.info("Received member created event: {}", event);
        kafkaEventHandler.handleEvent(event);
    }

    @KafkaListener(topics = "${spring.kafka.topic.church-admin-updated}", groupId = "${spring.kafka.consumer-group-id}")
    public void consumeChurchAdminUpdatedEvent(ChurchAdminUpdatedEvent event) {
        log.info("Received church admin updated event: {}", event);
        kafkaEventHandler.handleEvent(event);
    }

    @KafkaListener(topics = "${spring.kafka.topic.elder-created}", groupId = "${spring.kafka.consumer-group-id}")
    public void consumeElderCreatedEvent(ElderCreatedEvent event) {
        log.info("Received elder created event: {}", event);
        kafkaEventHandler.handleEvent(event);
    }

    @KafkaListener(topics = "${spring.kafka.topic.deacon-created}", groupId = "${spring.kafka.consumer-group-id}")
    public void consumeDeaconCreatedEvent(DeaconCreatedEvent event) {
        log.info("Received deacon created event: {}", event);
        kafkaEventHandler.handleEvent(event);
    }
}
