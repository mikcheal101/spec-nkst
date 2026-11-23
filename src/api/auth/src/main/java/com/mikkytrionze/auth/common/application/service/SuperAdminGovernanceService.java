package com.mikkytrionze.auth.common.application.service;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.user.domain.model.AccountStatus;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.role.application.dto.ERole;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SuperAdminGovernanceService {
    private final UserRepository userRepository;

    public boolean isSuperAdmin(User user) {
        return user.getRoles() != null && user.getRoles().stream().anyMatch(r -> r.getName() == ERole.SUPER_ADMIN);
    }

    public void assertNotRootSuperAdminMutation(User target, String action) {
        if (target.isRootSuperAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ROOT_SUPER_ADMIN_IMMUTABLE", "Root Super Admin cannot be " + action);
        }
    }

    public void assertLastSuperAdminProtected(User target, boolean removingSuperAdminRole, AccountStatus newStatus) {
        boolean currentlySuperAdmin = isSuperAdmin(target) && target.getAccountStatus() == AccountStatus.ACTIVE;
        boolean willLoseSuperAdmin = removingSuperAdminRole || (newStatus != null && newStatus != AccountStatus.ACTIVE);
        if (currentlySuperAdmin && willLoseSuperAdmin) {
            long activeSuperAdmins = userRepository.findAll().stream()
                    .filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE)
                    .filter(this::isSuperAdmin)
                    .count();
            if (activeSuperAdmins <= 1) {
                throw new ApiException(HttpStatus.FORBIDDEN, "LAST_SUPER_ADMIN_PROTECTED", "At least one active Super Admin must remain");
            }
        }
    }

    public void assertStepUpRequiredForSecondarySuperAdmin(User actor, User target, String stepUpToken, StepUpGuardService stepUpGuardService) {
        if (target == null || actor == null) return;
        boolean targetIsSuperAdmin = isSuperAdmin(target);
        boolean actorIsSuperAdmin = isSuperAdmin(actor);
        if (targetIsSuperAdmin && actorIsSuperAdmin && !target.isRootSuperAdmin()) {
            // secondary super admin mutation requires step-up by actor
            stepUpGuardService.requireValidStepUp(stepUpToken, actor.getId());
        }
    }
}
