package com.mikkytrionze.nkst.member.domain.gateway;

import com.mikkytrionze.member.application.dto.MemberCreatedEvent;

/**
 * Gateway interface for publishing domain events related to members.
 * This abstraction decouples the member domain logic from the underlying
 * event infrastructure (e.g., Kafka, RabbitMQ, or Spring Application Events).
 */
public interface MemberEventPublisher {

    /**
     * Publishes an event triggered when a new member is successfully created in the system.
     *
     * @param memberCreatedEvent the event object containing details of the newly created member
     */
    void publishMemberCreated(MemberCreatedEvent memberCreatedEvent);
}
