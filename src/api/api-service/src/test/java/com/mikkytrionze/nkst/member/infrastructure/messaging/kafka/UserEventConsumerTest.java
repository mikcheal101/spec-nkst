package com.mikkytrionze.nkst.member.infrastructure.messaging.kafka;

import static org.mockito.Mockito.verify;

import com.mikkytrionze.nkst.member.domain.service.MemberService;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserEventConsumerTest {

    @Mock
    private MemberService memberService;

    @InjectMocks
    private UserEventConsumer consumer;

    @Test
    void shouldConsumeUserUpdatedEvent() {
        UserUpdatedEvent event = UserUpdatedEvent.builder()
                .memberId(1L)
                .userId(2L)
                .build();

        consumer.consumeUserUpdatedEvent(event);

        verify(memberService).processUserUpdatedEvent(event);
    }
}
