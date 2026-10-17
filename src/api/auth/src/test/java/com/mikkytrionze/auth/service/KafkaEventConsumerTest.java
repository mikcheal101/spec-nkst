package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.service.KafkaEventHandler;
import com.mikkytrionze.auth.common.infrastructure.messaging.kafka.KafkaEventConsumer;
import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;
import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;
import com.mikkytrionze.member.application.dto.MemberCreatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class KafkaEventConsumerTest {

    @Mock
    private KafkaEventHandler kafkaEventHandler;

    @InjectMocks
    private KafkaEventConsumer kafkaEventConsumer;

    @Test
    void consumeMemberCreatedEvent_delegatesToHandler() {
        MemberCreatedEvent event = MemberCreatedEvent.builder()
                .memberId(1L).username("user").password("pass").roles(List.of("ROLE")).build();
        kafkaEventConsumer.consumeMemberCreatedEvent(event);
        verify(kafkaEventHandler).handleEvent(event);
    }

    @Test
    void consumeChurchAdminUpdatedEvent_delegatesToHandler() {
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .memberId(1L).churchId(2L).activate(true).build();
        kafkaEventConsumer.consumeChurchAdminUpdatedEvent(event);
        verify(kafkaEventHandler).handleEvent(event);
    }

    @Test
    void consumeElderCreatedEvent_delegatesToHandler() {
        ElderCreatedEvent event = ElderCreatedEvent.builder()
                .userId(1L).elderId(2L).memberId(3L).activate(true).build();
        kafkaEventConsumer.consumeElderCreatedEvent(event);
        verify(kafkaEventHandler).handleEvent(event);
    }

    @Test
    void consumeDeaconCreatedEvent_delegatesToHandler() {
        DeaconCreatedEvent event = DeaconCreatedEvent.builder()
                .userId(1L).deaconId(2L).memberId(3L).activate(true).build();
        kafkaEventConsumer.consumeDeaconCreatedEvent(event);
        verify(kafkaEventHandler).handleEvent(event);
    }
}
