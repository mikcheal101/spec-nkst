package com.mikkytrionze.nkst.deacon.domain.gateway;

import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;

/**
 * Domain gateway interface responsible for publishing deacon-related domain events
 * to external messaging systems (such as Kafka).
 * <p>
 * Following Hexagonal / Clean Architecture principles, this interface decouples
 * the core domain service logic from the concrete infrastructure messaging implementation.
 */
public interface DeaconEventPublisher {

    /**
     * Publishes an event signifying that a new deacon has been successfully created/promoted.
     *
     * @param event the {@link DeaconCreatedEvent} payload containing details of the newly created deacon
     */
    void publishDeaconCreated(DeaconCreatedEvent event);
}