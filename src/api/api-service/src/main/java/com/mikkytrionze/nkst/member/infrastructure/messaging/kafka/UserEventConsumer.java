package com.mikkytrionze.nkst.member.infrastructure.messaging.kafka;

import com.mikkytrionze.nkst.member.domain.service.MemberService;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventConsumer {

    private final MemberService memberService;

    @KafkaListener(topics = "${spring.kafka.topic.user-updated}", groupId = "${spring.kafka.consumer-group-id}")
    public void consumeUserUpdatedEvent(UserUpdatedEvent userUpdatedEvent) {
        log.info("Received user updated event, userId: {}, memberId: {}",
                userUpdatedEvent.getUserId(), userUpdatedEvent.getMemberId());

        memberService.processUserUpdatedEvent(userUpdatedEvent);
    }
}
