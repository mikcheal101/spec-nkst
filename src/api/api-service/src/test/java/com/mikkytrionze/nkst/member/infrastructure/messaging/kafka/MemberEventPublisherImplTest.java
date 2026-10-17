package com.mikkytrionze.nkst.member.infrastructure.messaging.kafka;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mikkytrionze.member.application.dto.MemberCreatedEvent;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class MemberEventPublisherImplTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private MemberEventPublisherImpl publisher;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(publisher, "memberCreatedTopic", "member-created-topic");
    }

    @Test
    void shouldPublishMemberCreatedEvent() {
        MemberCreatedEvent event = MemberCreatedEvent.builder()
                .memberId(1L)
                .username("u")
                .password("p")
                .roles(List.of("ADMIN"))
                .build();

        publisher.publishMemberCreated(event);

        verify(kafkaTemplate).send("member-created-topic", "1", event);
    }

    @Test
    void shouldThrowMessagingFailedWhenKafkaSendFails() {
        MemberCreatedEvent event = MemberCreatedEvent.builder()
                .memberId(1L)
                .username("u")
                .password("p")
                .roles(List.of("ADMIN"))
                .build();

        when(kafkaTemplate.send("member-created-topic", "1", event))
                .thenThrow(new RuntimeException("x"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> publisher.publishMemberCreated(event));

        assertEquals("messaging failed!", ex.getMessage());
        assertNotNull(ex.getCause());
        assertEquals("x", ex.getCause().getMessage());
    }
}
