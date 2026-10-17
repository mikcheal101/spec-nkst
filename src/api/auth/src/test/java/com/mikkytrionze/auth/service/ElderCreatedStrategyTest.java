package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.strategy.impl.ElderKafkaStrategy;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.elder.application.dto.ElderCreatedEvent;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ElderCreatedStrategyTest {

    @Mock
    private UserService userService;

    @Mock
    private UserLookupService userLookupService;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private ElderKafkaStrategy elderKafkaStrategy;

    private Role elderRole;
    private User user;

    @BeforeEach
    void setUp() {
        elderRole = Role.builder().id(3L).name(ERole.ELDER).build();
        user = User.builder().id(1L).username("elder-user").roles(new HashSet<>()).build();
    }

    @Test
    void process_activateTrue_addsRole() {
        ElderCreatedEvent event = ElderCreatedEvent.builder()
                .userId(1L).activate(true).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.ELDER)).thenReturn(Optional.of(elderRole));

        elderKafkaStrategy.process(event);

        assertTrue(user.getRoles().contains(elderRole));
        verify(userService).updateObject(user);
    }

    @Test
    void process_activateFalse_removesRole() {
        user.getRoles().add(elderRole);
        ElderCreatedEvent event = ElderCreatedEvent.builder()
                .userId(1L).activate(false).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.ELDER)).thenReturn(Optional.of(elderRole));

        elderKafkaStrategy.process(event);

        assertFalse(user.getRoles().stream().anyMatch(r -> r.getId().equals(3L)));
        verify(userService).updateObject(user);
    }

    @Test
    void process_userNotFound_doesNotUpdate() {
        ElderCreatedEvent event = ElderCreatedEvent.builder()
                .userId(99L).activate(true).build();

        when(userLookupService.findByUserId(99L)).thenReturn(null);

        elderKafkaStrategy.process(event);

        verify(userService, never()).updateObject(any());
    }

    @Test
    void process_roleNotFound_doesNotUpdate() {
        ElderCreatedEvent event = ElderCreatedEvent.builder()
                .userId(1L).activate(true).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.ELDER)).thenReturn(Optional.empty());

        elderKafkaStrategy.process(event);

        verify(userService, never()).updateObject(any());
    }

    @Test
    void supports_withElderCreatedEvent_returnsTrue() {
        assertTrue(elderKafkaStrategy.supports(ElderCreatedEvent.class));
    }

    @Test
    void supports_withOtherClass_returnsFalse() {
        assertFalse(elderKafkaStrategy.supports(String.class));
    }
}
