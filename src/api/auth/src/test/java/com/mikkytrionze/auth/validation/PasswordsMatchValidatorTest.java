package com.mikkytrionze.auth.validation;

import com.mikkytrionze.auth.user.api.request.SignupRequest;
import com.mikkytrionze.auth.user.api.validation.PasswordsMatch;
import com.mikkytrionze.auth.user.api.validation.PasswordsMatchValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class PasswordsMatchValidatorTest {

    @Mock
    private ConstraintValidatorContext context;

    private PasswordsMatchValidator validator;

    @BeforeEach
    void setUp() throws Exception {
        PasswordsMatch annotation = SignupRequest.class.getAnnotation(PasswordsMatch.class);
        validator = new PasswordsMatchValidator();
        validator.initialize(annotation);
    }

    @Test
    void isValid_withMatchingPasswords_returnsTrue() {
        SignupRequest request = SignupRequest.builder()
                .username("test-user")
                .password("SamePassword123!")
                .confirmPassword("SamePassword123!")
                .build();

        assertTrue(validator.isValid(request, context));
    }

    @Test
    void isValid_withNonMatchingPasswords_returnsFalse() {
        SignupRequest request = SignupRequest.builder()
                .username("test-user")
                .password("Password123!")
                .confirmPassword("DifferentPassword456!")
                .build();

        assertFalse(validator.isValid(request, context));
    }

    @Test
    void isValid_withNullPassword_returnsFalse() {
        SignupRequest request = SignupRequest.builder()
                .username("test-user")
                .password(null)
                .confirmPassword("SomePassword123!")
                .build();

        assertFalse(validator.isValid(request, context));
    }

    @Test
    void isValid_withNullConfirmPassword_returnsFalse() {
        SignupRequest request = SignupRequest.builder()
                .username("test-user")
                .password("SomePassword123!")
                .confirmPassword(null)
                .build();

        assertFalse(validator.isValid(request, context));
    }

    @Test
    void isValid_withBothNull_returnsFalse() {
        SignupRequest request = SignupRequest.builder()
                .username("test-user")
                .password(null)
                .confirmPassword(null)
                .build();

        assertFalse(validator.isValid(request, context));
    }
}
