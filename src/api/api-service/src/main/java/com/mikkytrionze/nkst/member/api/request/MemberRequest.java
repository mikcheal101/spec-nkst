package com.mikkytrionze.nkst.member.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;


import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ValidateBaptismRecord
@Builder(toBuilder = true)
public class MemberRequest implements BaptismRequest {

    @NotBlank(message = "Telephone number is required!")
    private String tel;

    @NotBlank(message = "Last Name is required!")
    private String lastName;

    private String middleName;

    @NotBlank(message = "First Name is required!")
    private String firstName;

    @NotBlank(message = "Gender is required!")
    private String gender;

    @NotBlank(message = "Email Address is required!")
    private String emailAddress;

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
