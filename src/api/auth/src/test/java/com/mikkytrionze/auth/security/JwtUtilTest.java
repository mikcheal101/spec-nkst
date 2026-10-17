package com.mikkytrionze.auth.security;

import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private static final String SECRET = "thisIsMyTestSecretKeyForJwtUnitTestingPurposesOnly1234567890";
    private static final Long EXPIRATION = 3600000L;

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, EXPIRATION, 86400000L);
    }

    @Test
    void generateToken_returnsValidToken() {
        String username = "test-user";

        String token = jwtUtil.generateToken(username);

        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void getUsernameFromToken_withValidToken_returnsUsername() {
        String username = "test-user";
        String token = jwtUtil.generateToken(username);

        String extracted = jwtUtil.getUsernameFromToken(token);

        assertEquals(username, extracted);
    }

    @Test
    void validateJwt_withValidToken_returnsTrue() {
        String token = jwtUtil.generateToken("test-user");

        assertTrue(jwtUtil.validateJwt(token));
    }

    @Test
    void validateJwt_withInvalidSignature_returnsFalse() {
        SecretKey differentKey = Keys.hmacShaKeyFor("aDifferentSecretKeyThatIsLongEnoughForHmacSha256!!".getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .subject("test-user")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(differentKey)
                .compact();

        assertFalse(jwtUtil.validateJwt(token));
    }

    @Test
    void validateJwt_withMalformedToken_returnsFalse() {
        assertFalse(jwtUtil.validateJwt("malformed-jwt-token"));
    }

    @Test
    void validateJwt_withExpiredToken_returnsFalse() {
        JwtUtil shortLivedJwt = new JwtUtil(SECRET, -1000L, 86400000L);

        String token = shortLivedJwt.generateToken("test-user");

        assertFalse(shortLivedJwt.validateJwt(token));
    }

    @Test
    void validateJwt_withUnsignedToken_returnsFalse() {
        String unsignedJwt = Jwts.builder()
                .subject("test-user")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .compact();

        assertFalse(jwtUtil.validateJwt(unsignedJwt));
    }

    @Test
    void validateJwt_withEmptyToken_returnsFalse() {
        assertFalse(jwtUtil.validateJwt(""));
    }

    @Test
    void validateJwt_withNullToken_returnsFalse() {
        assertFalse(jwtUtil.validateJwt(null));
    }

    @Test
    void getTokenIdFromToken_withValidToken_returnsJti() {
        String token = jwtUtil.generateToken("test-user");

        String jti = jwtUtil.getTokenIdFromToken(token);

        assertNotNull(jti);
        assertFalse(jti.isBlank());
    }

    @Test
    void getExpirationFromToken_withValidToken_returnsPositiveTtl() {
        String token = jwtUtil.generateToken("test-user");

        long ttl = jwtUtil.getExpirationFromToken(token);

        assertTrue(ttl > 0);
        assertTrue(ttl <= EXPIRATION);
    }
}
