package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.service.KafkaEventDispatcher;
import com.mikkytrionze.auth.common.application.service.KafkaEventHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class KafkaEventHandlerTest {

    @Mock
    private KafkaEventDispatcher kafkaEventDispatcher;

    @InjectMocks
    private KafkaEventHandler kafkaEventHandler;

    @Test
    void handleEvent_delegatesToDispatcher() {
        Object event = new Object();
        kafkaEventHandler.handleEvent(event);
        verify(kafkaEventDispatcher).dispatch(event);
    }
}
