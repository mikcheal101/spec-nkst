package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.strategy.impl.MemberCreatedStrategy;
import com.mikkytrionze.auth.roles.domain.service.RoleService;
import com.mikkytrionze.auth.user.application.service.UserService;
import com.mikkytrionze.auth.user.domain.gateway.UserEventPublisher;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.member.application.dto.MemberCreatedEvent;
import com.mikkytrionze.role.application.dto.ERole;
import com.mikkytrionze.role.application.dto.UserUpdatedEvent;
import com.mikkytrionze.auth.roles.domain.model.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberCreatedStrategyTest {

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserService userService;

    @Mock
    private RoleService roleService;

    @Mock
    private UserEventPublisher userEventPublisher;

    @InjectMocks
    private MemberCreatedStrategy memberCreatedStrategy;

    @Test
    void process_createsUserAndPublishesEvent() {
        MemberCreatedEvent event = MemberCreatedEvent.builder()
                .memberId(10L)
                .username("new-member")
                .roles(List.of("MEMBER_UNBAPTISED"))
                .build();

        Role role = Role.builder().id(1L).name(ERole.MEMBER_UNBAPTISED).build();
        User savedUser = User.builder().id(5L).username("new-member").password("encoded").build();

        when(passwordEncoder.encode("new-member")).thenReturn("encoded");
        when(roleService.findByName(ERole.MEMBER_UNBAPTISED)).thenReturn(Optional.of(role));
        when(userService.saveObject(any(User.class))).thenReturn(savedUser);

        memberCreatedStrategy.process(event);

        verify(passwordEncoder).encode("new-member");
        verify(roleService).findByName(ERole.MEMBER_UNBAPTISED);
        verify(userService).saveObject(any(User.class));
        verify(userEventPublisher).publishUserUpdatedEvent(argThat(ue ->
                ue.getMemberId().equals(10L) && ue.getUserId().equals(5L)
        ));
    }

    @Test
    void supports_withMemberCreatedEvent_returnsTrue() {
        assertTrue(memberCreatedStrategy.supports(MemberCreatedEvent.class));
    }

    @Test
    void supports_withOtherClass_returnsFalse() {
        assertFalse(memberCreatedStrategy.supports(String.class));
    }
}
