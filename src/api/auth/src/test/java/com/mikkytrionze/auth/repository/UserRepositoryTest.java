package com.mikkytrionze.auth.repository;

import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.RefreshTokenRepository;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void findByUsername_withExistingUser_returnsUser() {
        User user = User.builder()
                .username("test-user-repo")
                .password("encoded-password")
                .build();
        userRepository.save(user);

        Optional<User> found = userRepository.findByUsername("test-user-repo");

        assertTrue(found.isPresent());
        assertEquals("test-user-repo", found.get().getUsername());
        assertEquals("encoded-password", found.get().getPassword());
    }

    @Test
    void findByUsername_withNonexistentUser_returnsEmpty() {
        Optional<User> found = userRepository.findByUsername("nonexistent-user-repo");

        assertFalse(found.isPresent());
    }

    @Test
    void existsByUsername_withExistingUser_returnsTrue() {
        User user = User.builder()
                .username("existing-user-repo")
                .password("encoded-password")
                .build();
        userRepository.save(user);

        assertTrue(userRepository.existsByUsername("existing-user-repo"));
    }

    @Test
    void existsByUsername_withNonexistentUser_returnsFalse() {
        assertFalse(userRepository.existsByUsername("nonexistent-user-repo"));
    }
}
