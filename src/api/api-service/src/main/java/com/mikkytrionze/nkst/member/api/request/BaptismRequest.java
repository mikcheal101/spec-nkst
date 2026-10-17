package com.mikkytrionze.nkst.member.api.request;

import java.time.LocalDate;

public interface BaptismRequest {

    Boolean getIsBaptised();

    Integer getSerialNumber();

    LocalDate getDateOfBaptism();

    String getWorshipCenter();

    String getBibleVerse();

    String getBaptisedBy();

    String getAddress();
}
