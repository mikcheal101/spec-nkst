package com.mikkytrionze.nkst.member.api.request;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;
import java.util.Objects;

public class BaptismRecordValidator implements ConstraintValidator<ValidateBaptismRecord, BaptismRequest> {

    @Override
    public boolean isValid(BaptismRequest baptismRequest, ConstraintValidatorContext constraintValidatorContext) {
        if (Objects.isNull(baptismRequest)) {
            return true;
        }

        // if the member is not baptized then no need to validate
        if (Boolean.FALSE.equals(baptismRequest.getIsBaptised())) {
            return true;
        }

        boolean isValid = true;
        constraintValidatorContext.disableDefaultConstraintViolation();

        if (baptismRequest.getSerialNumber() == null) {
            addViolation(constraintValidatorContext,
                    "serialNumber",
                    "Serial Number is required!");
            isValid = false;
        } else if (baptismRequest.getSerialNumber() <= 0) {
            addViolation(constraintValidatorContext,
                    "serialNumber",
                    "Serial Number cannot be less than 1!");
            isValid = false;
        }

        if (baptismRequest.getDateOfBaptism() == null) {
            addViolation(constraintValidatorContext,
                    "dateOfBaptism",
                    "Date of baptism is required!");
            isValid = false;
        } else if (baptismRequest.getDateOfBaptism().isAfter(LocalDate.now())) {
            addViolation(constraintValidatorContext,
                    "dateOfBaptism",
                    "Date of baptism cannot be a date in the future");
            isValid = false;
        }

        if (isBlank(baptismRequest.getWorshipCenter())) {
            addViolation(constraintValidatorContext,
                    "worshipCenter",
                    "Worship Center is required!");
            isValid = false;
        }

        if (isBlank(baptismRequest.getBibleVerse())) {
            addViolation(constraintValidatorContext,
                    "bibleVerse",
                    "Bible Verse is required!");
            isValid = false;
        }

        if (isBlank(baptismRequest.getBaptisedBy())) {
            addViolation(constraintValidatorContext,
                    "baptizedBy",
                    "Baptised By is required!");
            isValid = false;
        }

        if (isBlank(baptismRequest.getAddress())) {
            addViolation(constraintValidatorContext,
                    "address",
                    "Address is required!");
            isValid = false;
        }

        return isValid;
    }

    private boolean isBlank(String value) {
        return Objects.isNull(value) || value.trim().isEmpty() || value.trim().isBlank();
    }

    private void addViolation(
            ConstraintValidatorContext constraintValidatorContext,
            String fieldName,
            String message) {
        constraintValidatorContext
                .buildConstraintViolationWithTemplate(message)
                .addPropertyNode(fieldName)
                .addConstraintViolation();
    }
}
