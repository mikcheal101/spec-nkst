package com.mikkytrionze.auth.common.application.strategy.impl;

import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.mikkytrionze.auth.common.application.strategy.KafkaEventStrategy;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.gateway.UserEventPublisher;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.member.application.dto.MemberCreatedEvent;
import com.mikkytrionze.role.application.dto.ERole;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberCreatedStrategy implements KafkaEventStrategy<MemberCreatedEvent> {

    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final RoleService roleService;
    private final UserEventPublisher userEventPublisher;

    @Override
    public void process(MemberCreatedEvent memberCreatedEvent) {
        log.info("Processing member created event for username: {}", memberCreatedEvent.getUsername());
        User user = new User();
        user.setUsername(memberCreatedEvent.getUsername());
        user.setPassword(passwordEncoder.encode(memberCreatedEvent.getUsername()));
        user.setRoles(memberCreatedEvent.getRoles().stream()
                .map(roleName -> roleService.findByName(ERole.valueOf(roleName.toUpperCase()))
                        .orElse(null))
                .collect(Collectors.toSet()));
        User savedUser = userService.saveObject(user);

        userEventPublisher.publishUserUpdatedEvent(UserUpdatedEvent.builder()
                .memberId(memberCreatedEvent.getMemberId())
                .userId(savedUser.getId())
                .build());
    }

    @Override
    public boolean supports(Class<?> clazz) {
        return MemberCreatedEvent.class.equals(clazz);
    }

}
