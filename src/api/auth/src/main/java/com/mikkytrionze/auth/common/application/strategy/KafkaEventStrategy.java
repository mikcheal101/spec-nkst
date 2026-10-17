package com.mikkytrionze.auth.common.application.strategy;

public interface KafkaEventStrategy<T> {
    void process(T event);
    boolean supports(Class<?> clazz);
}
