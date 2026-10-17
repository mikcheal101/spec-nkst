package com.mikkytrionze.nkst.member.api.request;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BaptismRecordValidatorTest {

    private BaptismRecordValidator validator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder.NodeBuilderCustomizableContext nodeBuilder;

    @BeforeEach
    void setUp() {
        validator = new BaptismRecordValidator();
        lenient().when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
        lenient().when(violationBuilder.addPropertyNode(anyString())).thenReturn(nodeBuilder);
        lenient().when(nodeBuilder.addConstraintViolation()).thenReturn(context);
    }

    @Test
    void shouldReturnTrueWhenMemberRequestIsNull() {
        assertTrue(validator.isValid(null, context));
    }

    @Test
    void shouldReturnTrueWhenMemberIsNotBaptised() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(false)
                .build();
        assertTrue(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenSerialNumberIsNull() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .dateOfBaptism(LocalDate.now().minusDays(1))
                .worshipCenter("Main Center")
                .bibleVerse("John 3:16")
                .baptisedBy("Pastor Mike")
                .address("123 Main St")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenSerialNumberIsZero() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(0)
                .dateOfBaptism(LocalDate.now().minusDays(1))
                .worshipCenter("Main Center")
                .bibleVerse("John 3:16")
                .baptisedBy("Pastor Mike")
                .address("123 Main St")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenDateOfBaptismIsNull() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(123)
                .worshipCenter("Main Center")
                .bibleVerse("John 3:16")
                .baptisedBy("Pastor Mike")
                .address("123 Main St")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenDateOfBaptismIsFuture() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(123)
                .dateOfBaptism(LocalDate.now().plusDays(1))
                .worshipCenter("Main Center")
                .bibleVerse("John 3:16")
                .baptisedBy("Pastor Mike")
                .address("123 Main St")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenWorshipCenterIsBlank() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(123)
                .dateOfBaptism(LocalDate.now().minusDays(1))
                .worshipCenter("   ")
                .bibleVerse("John 3:16")
                .baptisedBy("Pastor Mike")
                .address("123 Main St")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenBibleVerseIsBlank() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(123)
                .dateOfBaptism(LocalDate.now().minusDays(1))
                .worshipCenter("Main Center")
                .bibleVerse("   ")
                .baptisedBy("Pastor Mike")
                .address("123 Main St")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenBaptisedByIsBlank() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(123)
                .dateOfBaptism(LocalDate.now().minusDays(1))
                .worshipCenter("Main Center")
                .bibleVerse("John 3:16")
                .baptisedBy("   ")
                .address("123 Main St")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnFalseWhenAddressIsBlank() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(123)
                .dateOfBaptism(LocalDate.now().minusDays(1))
                .worshipCenter("Main Center")
                .bibleVerse("John 3:16")
                .baptisedBy("Pastor Mike")
                .address("   ")
                .build();
        assertFalse(validator.isValid(request, context));
    }

    @Test
    void shouldReturnTrueWhenAllFieldsAreValid() {
        MemberRequest request = MemberRequest.builder()
                .isBaptised(true)
                .serialNumber(123)
                .dateOfBaptism(LocalDate.now().minusDays(1))
                .worshipCenter("Main Center")
                .bibleVerse("John 3:16")
                .baptisedBy("Pastor Mike")
                .address("123 Main St")
                .build();
        assertTrue(validator.isValid(request, context));
    }
}
