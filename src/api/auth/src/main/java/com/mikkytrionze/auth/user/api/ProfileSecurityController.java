package com.mikkytrionze.auth.user.api;

import com.mikkytrionze.auth.common.application.exception.ApiException;
import com.mikkytrionze.auth.common.application.service.AuditLogService;
import com.mikkytrionze.auth.common.application.service.RateLimitService;
import com.mikkytrionze.auth.common.application.service.StepUpGuardService;
import com.mikkytrionze.auth.common.infrastructure.config.RateLimitConfig;
import com.mikkytrionze.auth.user.api.request.ChangePasswordRequest;
import com.mikkytrionze.auth.user.application.service.SessionCutoffService;
import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileSecurityController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionCutoffService sessionCutoffService;
    private final AuditLogService auditLogService;
    private final RateLimitService rateLimitService;
    private final RateLimitConfig rateLimitConfig;
    private final StepUpGuardService stepUpGuardService;

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication auth, HttpServletRequest http) {
        if (auth == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required");
        User user = userRepository.findByUsername(auth.getName()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Authentication required"));
        String ip = http.getRemoteAddr();
        rateLimitService.check("pwd-change:" + user.getId() + ":" + ip, rateLimitConfig.getStepupGovernanceMaxRequests(), rateLimitConfig.getStepupGovernanceWindowMinutes());
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            auditLogService.record("PROFILE_PASSWORD_CHANGE", "USER", String.valueOf(user.getId()), "DENIED", "INVALID_CURRENT_PASSWORD", user.getId(), user.getUsername(), null, null, ip, http.getHeader("User-Agent"));
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "Invalid credentials");
        }
        // step-up required for sensitive credential change
        stepUpGuardService.requireValidStepUp(req.getStepUpToken(), user.getId());
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        sessionCutoffService.cutoffUser(user, "PASSWORD_CHANGED", user.getId(), user.getUsername());
        auditLogService.record("PROFILE_PASSWORD_CHANGE", "USER", String.valueOf(user.getId()), "SUCCESS", null, user.getId(), user.getUsername(), null, null, ip, http.getHeader("User-Agent"));
        return ResponseEntity.noContent().build();
    }
}
