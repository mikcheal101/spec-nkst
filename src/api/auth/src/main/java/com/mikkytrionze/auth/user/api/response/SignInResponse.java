package com.mikkytrionze.auth.user.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class SignInResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private long permissionsVersion;

    // backward compatibility
    public String getToken() { return accessToken; }
    public void setToken(String token) { this.accessToken = token; }
}
