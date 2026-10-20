package com.quantumclk.erp.ops.logging;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class LogRedactorTest {

  @Test
  void redactsKeyValueSecrets() {
    assertEquals("password=***", LogRedactor.redact("password=secret"));
    assertEquals("token=***&page=2", LogRedactor.redact("token=abc123&page=2"));
    assertEquals("api_key=***", LogRedactor.redact("api_key: 'top secret'"));
  }

  @Test
  void redactsAuthorizationHeaders() {
    assertEquals("Authorization=***", LogRedactor.redact("Authorization: Bearer abc.def"));
    assertEquals("Cookie=***", LogRedactor.redact("Cookie: session=abc"));
    assertEquals("Bearer ***", LogRedactor.redact("Bearer abc.def"));
  }

  @Test
  void redactsJsonSecretsWithoutTouchingSafeFields() {
    String input = "{\"password\":\"p@ss\",\"name\":\"Asha\",\"token\":\"abc\"}";
    String output = LogRedactor.redact(input);
    assertFalse(output.contains("p@ss"));
    assertFalse(output.contains("\"abc\""));
    assertEquals("Asha", output.replaceAll(".*\"name\":\"([^\"]+)\".*", "$1"));
  }

  @Test
  void handlesNullAndEmpty() {
    assertNull(LogRedactor.redact(null));
    assertEquals("", LogRedactor.redact(""));
  }
}
