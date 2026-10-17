package com.mikkytrionze.nkst.elder.domain.gateway;

import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;

/**
 * Gateway interface for publishing domain events related to Elder management.
 * Defines the contract for broadcasting changes to external modules or systems
 * (e.g., via Kafka, RabbitMQ, or an Application Event Bus).
 */
public interface ElderEventPublisher {

    /**
     * Publishes an event indicating that a new elder has been successfully created.
     *
     * @param elderCreatedEvent the data transfer object containing the details
     *                          of the newly created elder
     */
    void publishElderCreated(ElderCreatedEvent elderCreatedEvent);
}