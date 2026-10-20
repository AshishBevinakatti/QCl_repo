package com.quantumclk.erp.ops.logging;

import java.util.regex.Pattern;

/** Redacts credentials and session material before a log line is written or returned. */
public final class LogRedactor {

  private static final String KEYS =
      "password|passwd|pwd|secret|token|access_token|refresh_token|api[_-]?key|authorization|cookie|set-cookie";

  private static final Pattern JSON_SECRET =
      Pattern.compile("(?i)\"(" + KEYS + ")\"\\s*:\\s*\"[^\"]*\"");
  private static final Pattern AUTH_HEADER =
      Pattern.compile(
          "(?i)\\b(authorization|cookie|set-cookie)\\s*:\\s*(?:Bearer|Basic)\\s+[^\\s,;&]+");
  private static final Pattern COOKIE =
      Pattern.compile("(?i)\\b(cookie|set-cookie)\\s*[=:]\\s*[^\\r\\n]*");
  private static final Pattern BEARER = Pattern.compile("(?i)\\bBearer\\s+[A-Za-z0-9._~+/=-]+");
  private static final Pattern BASIC = Pattern.compile("(?i)\\bBasic\\s+[A-Za-z0-9+/=]+");
  private static final Pattern KV_SECRET =
      Pattern.compile(
          "(?i)\\b(" + KEYS + ")\\s*[=:]\\s*(?!\\*\\*\\*)(\"[^\"]*\"|'[^']*'|[^\\s,;&]+)");

  private LogRedactor() {}

  public static String redact(String value) {
    if (value == null || value.isEmpty()) {
      return value;
    }
    String redacted = JSON_SECRET.matcher(value).replaceAll("\"$1\":\"***\"");
    redacted = AUTH_HEADER.matcher(redacted).replaceAll("$1=***");
    redacted = COOKIE.matcher(redacted).replaceAll("$1=***");
    redacted = BEARER.matcher(redacted).replaceAll("Bearer ***");
    redacted = BASIC.matcher(redacted).replaceAll("Basic ***");
    redacted = KV_SECRET.matcher(redacted).replaceAll("$1=***");
    return redacted;
  }
}
