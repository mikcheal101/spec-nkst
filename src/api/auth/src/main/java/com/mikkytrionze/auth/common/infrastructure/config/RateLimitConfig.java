package com.mikkytrionze.auth.common.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;

@Getter
@lombok.Setter
@Configuration
public class RateLimitConfig {
    @Value("${auth.ratelimit.store:redis}") private String store;
    @Value("${auth.ratelimit.signin.max-attempts:5}") private int signinMaxAttempts;
    @Value("${auth.ratelimit.signin.window-minutes:15}") private int signinWindowMinutes;
    @Value("${auth.ratelimit.refresh.max-requests:30}") private int refreshMaxRequests;
    @Value("${auth.ratelimit.refresh.window-minutes:15}") private int refreshWindowMinutes;
    @Value("${auth.ratelimit.reset-otp.max-requests:3}") private int resetOtpMaxRequests;
    @Value("${auth.ratelimit.reset-otp.window-minutes:15}") private int resetOtpWindowMinutes;
    @Value("${auth.ratelimit.stepup-governance.max-requests:10}") private int stepupGovernanceMaxRequests;
    @Value("${auth.ratelimit.stepup-governance.window-minutes:15}") private int stepupGovernanceWindowMinutes;
}
