package com.mikkytrionze.nkst.churchAdmin.domain.gateway;

import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;

/**
 * Gateway interface for publishing domain events related to church administrative changes.
 * This abstraction allows the application to notify other modules or external systems
 * whenever an administrative role is updated, assigned, or swapped.
 */
public interface ChurchAdminEventPublisher {

    /**
     * Publishes an event triggered when an administrator has been successfully
     * updated or reassigned for a church.
     *
     * @param churchAdminUpdatedEvent the event object containing the details of the
     *                                updated administrative assignment
     */
    void publishChurchAdminUpdated(ChurchAdminUpdatedEvent churchAdminUpdatedEvent);
}