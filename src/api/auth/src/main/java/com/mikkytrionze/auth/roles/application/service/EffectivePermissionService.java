package com.mikkytrionze.auth.roles.application.service;

import com.mikkytrionze.auth.roles.domain.model.Permission;
import com.mikkytrionze.auth.roles.domain.model.Role;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EffectivePermissionService {
    private final UserRepository userRepository;
    private final MeterRegistry meterRegistry;

    @Transactional(readOnly = true)
    public Set<String> resolve(String username) {
        return Timer.builder("governance.permission.resolution.timer").register(meterRegistry).record(() -> {
            User user = userRepository.findByUsername(username).orElseThrow();
            Set<String> out = new LinkedHashSet<>();
            for (Role role : user.getRoles()) {
                if (role == null || !role.isActive()) continue;
                for (Permission p : role.getPermissions()) add(out, p);
            }
            if (user.getPermissions() != null) for (Permission p : user.getPermissions()) add(out, p);
            return out;
        });
    }

    private void add(Set<String> out, Permission p) {
        if (p == null || !p.isActive()) return;
        if (p.getKey() != null) out.add(p.getKey());
        if (p.getLegacyAlias() != null) out.add(p.getLegacyAlias());
        if (p.getName() != null) out.add(p.getName());
    }
}
