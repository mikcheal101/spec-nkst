package com.mikkytrionze.nkst.member.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ValidateBaptismRecord
@Builder(toBuilder = true)
public class UpdateMemberRequest implements BaptismRequest {

    @NotBlank(message = "Last Name is required!")
    private String lastName;

    private String middleName;

    @NotBlank(message = "First Name is required!")
    private String firstName;

    @NotBlank(message = "Gender is required!")
    private String gender;

    @NotNull(message = "Church ID is required!")
    private Long churchId;

    private String address;

    @Builder.Default
    private Boolean isBaptised = false;

    @Builder.Default
    private Boolean isAdmin = false;

    private Integer serialNumber;
    private String worshipCenter;
    private String bibleVerse;
    private String baptisedBy;
    private String remark;
    private String imageUri;
    private LocalDate dateOfBaptism;
}
