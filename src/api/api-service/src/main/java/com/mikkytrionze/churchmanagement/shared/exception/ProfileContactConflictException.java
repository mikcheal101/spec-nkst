package com.mikkytrionze.churchmanagement.shared.exception;

public class ProfileContactConflictException extends RuntimeException {
    public ProfileContactConflictException() {
        super("Unable to update profile with the provided information.");
    }
}
