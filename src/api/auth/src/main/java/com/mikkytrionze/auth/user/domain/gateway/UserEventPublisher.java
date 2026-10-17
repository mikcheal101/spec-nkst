package com.mikkytrionze.auth.user.domain.gateway;

import com.mikkytrionze.role.application.dto.UserUpdatedEvent;

/**
 * UserEventPublisher is an interface that defines the contract for publishing user-related events.
 * It provides a method to publish a UserUpdatedEvent, which can be implemented by different event publishing mechanisms.
 */
public interface UserEventPublisher {

    /**
     * Publishes a UserUpdatedEvent to notify other components or services about the update of a user.
     *
     * @param userUpdatedEvent the event containing information about the updated user
     */
    void publishUserUpdatedEvent(UserUpdatedEvent userUpdatedEvent);
}
