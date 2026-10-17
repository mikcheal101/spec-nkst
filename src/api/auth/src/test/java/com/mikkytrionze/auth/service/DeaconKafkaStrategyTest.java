package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.strategy.impl.DeaconKafkaStrategy;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.deacon.application.dto.DeaconCreatedEvent;
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
class DeaconKafkaStrategyTest {

    @Mock
    private UserService userService;

    @Mock
    private UserLookupService userLookupService;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private DeaconKafkaStrategy deaconKafkaStrategy;

    private Role deaconRole;
    private User user;

    @BeforeEach
    void setUp() {
        deaconRole = Role.builder().id(4L).name(ERole.DEACON).build();
        user = User.builder().id(1L).username("deacon-user").roles(new HashSet<>()).build();
    }

    @Test
    void process_activateTrue_addsRole() {
        DeaconCreatedEvent event = DeaconCreatedEvent.builder()
                .userId(1L).activate(true).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.DEACON)).thenReturn(Optional.of(deaconRole));

        deaconKafkaStrategy.process(event);

        assertTrue(user.getRoles().contains(deaconRole));
        verify(userService).updateObject(user);
    }

    @Test
    void process_activateFalse_removesRole() {
        user.getRoles().add(deaconRole);
        DeaconCreatedEvent event = DeaconCreatedEvent.builder()
                .userId(1L).activate(false).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.DEACON)).thenReturn(Optional.of(deaconRole));

        deaconKafkaStrategy.process(event);

        assertFalse(user.getRoles().stream().anyMatch(r -> r.getId().equals(4L)));
        verify(userService).updateObject(user);
    }

    @Test
    void process_userNotFound_doesNotUpdate() {
        DeaconCreatedEvent event = DeaconCreatedEvent.builder()
                .userId(99L).activate(true).build();

        when(userLookupService.findByUserId(99L)).thenReturn(null);

        deaconKafkaStrategy.process(event);

        verify(userService, never()).updateObject(any());
    }

    @Test
    void process_roleNotFound_doesNotUpdate() {
        DeaconCreatedEvent event = DeaconCreatedEvent.builder()
                .userId(1L).activate(true).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.DEACON)).thenReturn(Optional.empty());

        deaconKafkaStrategy.process(event);

        verify(userService, never()).updateObject(any());
    }

    @Test
    void supports_withDeaconCreatedEvent_returnsTrue() {
        assertTrue(deaconKafkaStrategy.supports(DeaconCreatedEvent.class));
    }

    @Test
    void supports_withOtherClass_returnsFalse() {
        assertFalse(deaconKafkaStrategy.supports(String.class));
    }
}
