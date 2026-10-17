package com.mikkytrionze.auth.user.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapperImpl;

import java.util.Objects;

public class PasswordsMatchValidator implements ConstraintValidator<PasswordsMatch, Object> {

    private String password;
    private String passwordMatch;

    @Override
    public void initialize(PasswordsMatch passwordsMatch) {
        this.password = passwordsMatch.field();
        this.passwordMatch = passwordsMatch.fieldMatch();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext constraintValidatorContext) {
        Object passwordField = new BeanWrapperImpl(value).getPropertyValue(password);
        Object passwordMatchField = new BeanWrapperImpl(value).getPropertyValue(passwordMatch);

        return !Objects.isNull(passwordField) && passwordField.equals(passwordMatchField);
    }
}
