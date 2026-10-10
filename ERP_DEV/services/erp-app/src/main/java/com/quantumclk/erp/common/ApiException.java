package com.quantumclk.erp.common;

import java.util.Map;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

/**
 * API failure with a stable machine-readable code plus details for the UI
 * (lesson 2026-10-10: raw UUIDs in reason strings are user-hostile — the
 * message stays human, the ids travel in details).
 */
public class ApiException extends ResponseStatusException {

  private final String code;
  private final Map<String, Object> details;

  public ApiException(HttpStatusCode status, String code, String reason,
      Map<String, Object> details) {
    super(status, reason);
    this.code = code;
    this.details = details != null ? details : Map.of();
  }

  public String getCode() {
    return code;
  }

  public Map<String, Object> getDetails() {
    return details;
  }
}
