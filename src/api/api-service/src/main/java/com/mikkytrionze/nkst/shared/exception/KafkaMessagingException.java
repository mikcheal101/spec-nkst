package com.mikkytrionze.nkst.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an infrastructure-level error occurs during message
 * publishing or consumption (e.g., Kafka communication failure).
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE) // 503 is appropriate for infra failures
public class KafkaMessagingException extends RuntimeException {
    public KafkaMessagingException(Throwable cause) {
        super("Kafka: Messaging failed!", cause);
    }
}
