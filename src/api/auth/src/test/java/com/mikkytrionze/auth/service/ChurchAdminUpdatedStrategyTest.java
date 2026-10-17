package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.strategy.impl.ChurchAdminUpdatedStrategy;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.churchAdmin.application.dto.ChurchAdminUpdatedEvent;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChurchAdminUpdatedStrategyTest {

    @Mock
    private UserService userService;

    @Mock
    private UserLookupService userLookupService;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private ChurchAdminUpdatedStrategy churchAdminUpdatedStrategy;

    private Role churchAdminRole;
    private User user;

    @BeforeEach
    void setUp() {
        churchAdminRole = Role.builder().id(2L).name(ERole.CHURCH_ADMIN).build();
        user = User.builder().id(1L).username("admin-user").roles(new HashSet<>()).build();
    }

    @Test
    void process_activateTrue_addsRole() {
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .memberId(1L).churchId(10L).activate(true).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.CHURCH_ADMIN)).thenReturn(Optional.of(churchAdminRole));

        churchAdminUpdatedStrategy.process(event);

        assertTrue(user.getRoles().contains(churchAdminRole));
        verify(userService).updateObject(user);
    }

    @Test
    void process_activateFalse_removesRole() {
        user.getRoles().add(churchAdminRole);
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .memberId(1L).churchId(10L).activate(false).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.CHURCH_ADMIN)).thenReturn(Optional.of(churchAdminRole));

        churchAdminUpdatedStrategy.process(event);

        assertFalse(user.getRoles().stream().anyMatch(r -> r.getId().equals(2L)));
        verify(userService).updateObject(user);
    }

    @Test
    void process_userNotFound_doesNotUpdate() {
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .memberId(99L).churchId(10L).activate(true).build();

        when(userLookupService.findByUserId(99L)).thenReturn(null);

        churchAdminUpdatedStrategy.process(event);

        verify(userService, never()).updateObject(any());
    }

    @Test
    void process_roleNotFound_doesNotUpdate() {
        ChurchAdminUpdatedEvent event = ChurchAdminUpdatedEvent.builder()
                .memberId(1L).churchId(10L).activate(true).build();

        when(userLookupService.findByUserId(1L)).thenReturn(user);
        when(roleService.findByName(ERole.CHURCH_ADMIN)).thenReturn(Optional.empty());

        churchAdminUpdatedStrategy.process(event);

        verify(userService, never()).updateObject(any());
    }

    @Test
    void supports_withChurchAdminUpdatedEvent_returnsTrue() {
        assertTrue(churchAdminUpdatedStrategy.supports(ChurchAdminUpdatedEvent.class));
    }

    @Test
    void supports_withOtherClass_returnsFalse() {
        assertFalse(churchAdminUpdatedStrategy.supports(String.class));
    }
}
