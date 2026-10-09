package com.quantumclk.erp.common;

import java.util.Map;

/**
 * Contract error shape (see docs/02-architecture/api.md): code + human message
 * + requestId for log correlation. Never carries secrets or stack traces.
 */
public record ApiError(String code, String message, String requestId, Map<String, Object> details) {}
