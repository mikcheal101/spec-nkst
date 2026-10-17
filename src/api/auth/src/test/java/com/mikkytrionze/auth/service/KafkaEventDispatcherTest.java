package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.service.KafkaEventDispatcher;
import com.mikkytrionze.auth.common.application.strategy.KafkaEventStrategy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KafkaEventDispatcherTest {

    @Mock
    private KafkaEventStrategy<Object> strategy1;

    @Mock
    private KafkaEventStrategy<Object> strategy2;

    @InjectMocks
    private KafkaEventDispatcher kafkaEventDispatcher;

    @Test
    void dispatch_withMatchingStrategy_callsProcess() {
        Object event = new Object();
        when(strategy1.supports(Object.class)).thenReturn(true);

        KafkaEventDispatcher dispatcher = new KafkaEventDispatcher(List.of(strategy1, strategy2));
        dispatcher.dispatch(event);

        verify(strategy1).process(event);
        verify(strategy2, never()).process(any());
    }

    @Test
    void dispatch_withNoMatchingStrategy_doesNothing() {
        Object event = new Object();
        when(strategy1.supports(Object.class)).thenReturn(false);
        when(strategy2.supports(Object.class)).thenReturn(false);

        KafkaEventDispatcher dispatcher = new KafkaEventDispatcher(List.of(strategy1, strategy2));
        dispatcher.dispatch(event);

        verify(strategy1, never()).process(any());
        verify(strategy2, never()).process(any());
    }

    @Test
    void dispatch_withEmptyStrategies_doesNothing() {
        KafkaEventDispatcher dispatcher = new KafkaEventDispatcher(List.of());
        dispatcher.dispatch(new Object());
    }
}
