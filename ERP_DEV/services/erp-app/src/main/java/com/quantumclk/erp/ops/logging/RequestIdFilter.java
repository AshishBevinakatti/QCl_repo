package com.quantumclk.erp.ops.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Adds a validated request ID to the response, MDC and error contract. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RequestIdFilter extends OncePerRequestFilter {

  public static final String HEADER = "X-Request-Id";
  public static final String ATTRIBUTE = "erp.requestId";
  private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9._:-]{8,64}");

  private final String serviceName;
  private final String environment;

  public RequestIdFilter(
      @Value("${spring.application.name:erp-app}") String serviceName,
      @Value("${ops.environment:local}") String environment) {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String incoming = request.getHeader(HEADER);
    String requestId =
        incoming != null && SAFE_ID.matcher(incoming).matches()
            ? incoming
            : UUID.randomUUID().toString();
    request.setAttribute(ATTRIBUTE, requestId);
    response.setHeader(HEADER, requestId);
    MDC.put("requestId", requestId);
    MDC.put("service", serviceName);
    MDC.put("environment", environment);
    try {
      chain.doFilter(request, response);
    } finally {
      MDC.remove("requestId");
      MDC.remove("service");
      MDC.remove("environment");
    }
  }
}
