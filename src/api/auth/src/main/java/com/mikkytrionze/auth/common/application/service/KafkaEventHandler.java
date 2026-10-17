package com.mikkytrionze.auth.common.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KafkaEventHandler {

    private final KafkaEventDispatcher kafkaEventDispatcher;

    @Transactional
    public void handleEvent(Object event) {
        kafkaEventDispatcher.dispatch(event);
    }
}
