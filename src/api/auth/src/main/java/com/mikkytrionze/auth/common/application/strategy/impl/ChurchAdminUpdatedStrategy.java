package com.mikkytrionze.auth.common.application.strategy.impl;

import org.springframework.stereotype.Component;

import com.mikkytrionze.auth.common.application.strategy.KafkaEventStrategy;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.role.application.dto.ERole;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChurchAdminUpdatedStrategy implements KafkaEventStrategy<ChurchAdminUpdatedEvent> {

    private final UserService userService;
    private final UserLookupService userLookupService;
    private final RoleService roleService;

    @Override
    public void process(ChurchAdminUpdatedEvent event) {
        log.info("Processing church admin updated event for memberId: {}, churchId: {}, activate: {}",
                event.getMemberId(), event.getChurchId(), event.getActivate());

        User user = userLookupService.findByUserId(event.getMemberId());
        Role role = roleService.findByName(ERole.CHURCH_ADMIN).orElse(null);

        if (user == null) {
            log.warn("User with memberId {} not found!", event.getMemberId());
            return;
        }

        if (role == null) {
            log.warn("Role: {} not found!", ERole.CHURCH_ADMIN.name());
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
        return ChurchAdminUpdatedEvent.class.equals(clazz);
    }
}
