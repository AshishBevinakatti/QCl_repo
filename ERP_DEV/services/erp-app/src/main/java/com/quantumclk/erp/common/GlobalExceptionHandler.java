package com.quantumclk.erp.common;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/** Maps exceptions to the contract error shape; echoes X-Request-Id or mints one. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(
      org.springframework.web.bind.MethodArgumentNotValidException ex, HttpServletRequest req) {
    String message =
        ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + " " + e.getDefaultMessage())
            .findFirst()
            .orElse("invalid request");
    return ResponseEntity.badRequest()
        .body(new ApiError("VALIDATION_FAILED", message, requestId(req), Map.of()));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiError> handleStatus(ResponseStatusException ex, HttpServletRequest req) {    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
    if (status == null) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    String code = status == HttpStatus.NOT_FOUND ? "NOT_FOUND" : "REQUEST_FAILED";
    return ResponseEntity.status(status)
        .body(new ApiError(code, ex.getReason(), requestId(req), Map.of()));
  }

  static String requestId(HttpServletRequest req) {
    String incoming = req.getHeader("X-Request-Id");
    return incoming != null && !incoming.isBlank() ? incoming : UUID.randomUUID().toString();
  }
}
