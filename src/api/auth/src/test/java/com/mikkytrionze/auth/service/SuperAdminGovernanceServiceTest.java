package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.StepUpGuardService;
import com.mikkytrionze.auth.common.application.service.SuperAdminGovernanceService;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SuperAdminGovernanceServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SuperAdminGovernanceService service;

    private User superAdmin(long id, boolean root, AccountStatus status) {
        Role r = Role.builder().id(1L).name(ERole.SUPER_ADMIN).build();
        return User.builder().id(id).username("u"+id).rootSuperAdmin(root).accountStatus(status).roles(new java.util.HashSet<>(Set.of(r))).build();
    }

    @Test
    void assertNotRootSuperAdminMutation_throwsForRoot() {
        User root = superAdmin(1, true, AccountStatus.ACTIVE);
        ApiException ex = assertThrows(ApiException.class, () -> service.assertNotRootSuperAdminMutation(root, "disabled"));
        assertEquals(403, ex.getStatus().value());
        assertEquals("ROOT_SUPER_ADMIN_IMMUTABLE", ex.getCode());
    }

    @Test
    void assertNotRootSuperAdminMutation_allowsNonRoot() {
        User user = superAdmin(2, false, AccountStatus.ACTIVE);
        assertDoesNotThrow(() -> service.assertNotRootSuperAdminMutation(user, "disabled"));
    }

    @Test
    void assertLastSuperAdminProtected_throwsWhenRemovingLastActiveSuperAdmin() {
        User target = superAdmin(1, false, AccountStatus.ACTIVE);
        when(userRepository.findAll()).thenReturn(List.of(target));

        ApiException ex = assertThrows(ApiException.class, () -> service.assertLastSuperAdminProtected(target, true, null));
        assertEquals(403, ex.getStatus().value());
        assertEquals("LAST_SUPER_ADMIN_PROTECTED", ex.getCode());
    }

    @Test
    void assertLastSuperAdminProtected_allowsWhenAnotherActiveSuperAdminExists() {
        User target = superAdmin(1, false, AccountStatus.ACTIVE);
        User other = superAdmin(2, false, AccountStatus.ACTIVE);
        when(userRepository.findAll()).thenReturn(List.of(target, other));

        assertDoesNotThrow(() -> service.assertLastSuperAdminProtected(target, true, null));
    }

    @Test
    void assertStepUpRequiredForSecondarySuperAdmin_requiresStepUpForSecondaryTarget() {
        User actor = superAdmin(1, true, AccountStatus.ACTIVE);
        User target = superAdmin(2, false, AccountStatus.ACTIVE);
        StepUpGuardService stepUpGuardService = mock(StepUpGuardService.class);

        service.assertStepUpRequiredForSecondarySuperAdmin(actor, target, "token", stepUpGuardService);

        verify(stepUpGuardService).requireValidStepUp("token", 1L);
    }

    @Test
    void assertStepUpRequiredForSecondarySuperAdmin_skipsForRootTargetMutationBySelfContext() {
        User actor = superAdmin(1, true, AccountStatus.ACTIVE);
        User target = superAdmin(1, true, AccountStatus.ACTIVE);
        StepUpGuardService stepUpGuardService = mock(StepUpGuardService.class);

        service.assertStepUpRequiredForSecondarySuperAdmin(actor, target, null, stepUpGuardService);

        verify(stepUpGuardService, never()).requireValidStepUp(any(), any());
    }
}
