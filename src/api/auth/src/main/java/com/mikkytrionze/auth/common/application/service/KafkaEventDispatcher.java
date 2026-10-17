package com.mikkytrionze.auth.common.application.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mikkytrionze.auth.common.application.strategy.KafkaEventStrategy;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KafkaEventDispatcher {

    private final List<KafkaEventStrategy<?>> strategies;

    public <T> void dispatch(T event) {
        strategies.stream()
                .filter(strategy -> strategy.supports(event.getClass()))
                .findFirst()
                .ifPresent(strategy -> {
                    // Safe cast because we checked with .supports()
                    @SuppressWarnings("unchecked")
                    KafkaEventStrategy<T> typedStrategy = (KafkaEventStrategy<T>) strategy;
                    typedStrategy.process(event);
                });
    }

}
