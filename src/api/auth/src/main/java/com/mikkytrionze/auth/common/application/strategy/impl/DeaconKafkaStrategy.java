package com.mikkytrionze.auth.common.application.strategy.impl;

import org.springframework.stereotype.Component;

import com.mikkytrionze.auth.common.application.strategy.KafkaEventStrategy;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;
import com.mikkytrionze.role.application.dto.ERole;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeaconKafkaStrategy implements KafkaEventStrategy<DeaconCreatedEvent> {
    private final UserService userService;
    private final UserLookupService userLookupService;
    private final RoleService roleService;

    @Override
    public void process(DeaconCreatedEvent event) {
        log.info("Processing elder created event: {}", event);

        User user = userLookupService.findByUserId(event.getUserId());
        
        if (user == null) {
            log.warn("User with memberId {} not found!", event.getUserId());
            return;
        }

        Role role = roleService.findByName(ERole.DEACON).orElse(null);
        if (role == null) {
            log.warn("Role: {} not found!", ERole.DEACON.name());
            return;
        }

        if (event.getActivate()) {
            user.getRoles().add(role);
        } else {
            user.getRoles().removeIf(userRole -> userRole.getId().equals(role.getId()));
        }
        userService.updateObject(user);
    }

    @Override
    public boolean supports(Class<?> clazz) {
        return DeaconCreatedEvent.class.equals(clazz);
    }
}
