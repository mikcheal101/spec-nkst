package com.mikkytrionze.announcement.shared.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(Instant timestamp, Integer status, String error, String code, String message, String path, String correlationId, Map<String,Object> details) {}
