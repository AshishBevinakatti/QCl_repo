package com.quantumclk.erp.health;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Liveness probe for CI, compose healthchecks, and future K8s readiness. */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

  @GetMapping
  public Map<String, String> health() {
    return Map.of("status", "UP", "service", "erp-app");
  }
}
