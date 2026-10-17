package com.mikkytrionze.nkst.shared.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder(toBuilder = true)
public class ErrorResponse {

    private String message;
    private Integer status;
    private Instant timestamp;
}
