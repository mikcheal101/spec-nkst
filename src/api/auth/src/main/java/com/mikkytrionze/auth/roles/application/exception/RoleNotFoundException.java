package com.mikkytrionze.auth.roles.application.exception;

public class RoleNotFoundException extends RuntimeException {
    public RoleNotFoundException(String message) {
        super(message == null ? "Role Not found!" : message);
    }


}
