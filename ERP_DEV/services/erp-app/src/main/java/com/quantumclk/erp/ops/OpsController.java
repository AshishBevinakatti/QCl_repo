package com.quantumclk.erp.ops;

import com.quantumclk.erp.ops.OpsDtos.OpsAuditPage;
import com.quantumclk.erp.ops.OpsDtos.OpsFlagsResponse;
import com.quantumclk.erp.ops.OpsDtos.OpsStatusResponse;
import com.quantumclk.erp.ops.OpsDtos.TelemetryStatus;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only operations console API. Permissions are resolved from role_permission
 * at request time (not trusted from the JWT); every successful read is audited
 * at a bounded rate.
 */
@RestController
@RequestMapping("/api/v1/ops")
public class OpsController {

  private final OpsTelemetryService telemetry;
  private final OpsFlagService flags;
  private final OpsAuditService audit;

  public OpsController(
      OpsTelemetryService telemetry, OpsFlagService flags, OpsAuditService audit) {
    this.telemetry = telemetry;
    this.flags = flags;
    this.audit = audit;
  }

  @GetMapping("/status")
  @PreAuthorize("@opsAuth.has('ops.read')")
  public OpsStatusResponse status(Authentication authentication, HttpServletRequest request) {
    audit.recordRead(authentication, "ops.status.read", request);
    return telemetry.status();
  }

  @GetMapping("/integrations")
  @PreAuthorize("@opsAuth.has('ops.integrations.read')")
  public TelemetryStatus integrations(
      Authentication authentication, HttpServletRequest request) {
    audit.recordRead(authentication, "ops.integrations.read", request);
    return telemetry.telemetry();
  }

  @GetMapping("/flags")
  @PreAuthorize("@opsAuth.has('ops.flags.read')")
  public OpsFlagsResponse flags(Authentication authentication, HttpServletRequest request) {
    audit.recordRead(authentication, "ops.flags.read", request);
    return flags.flags();
  }

  @GetMapping("/audit")
  @PreAuthorize("@opsAuth.has('ops.audit.read')")
  public OpsAuditPage audit(
      Authentication authentication,
      HttpServletRequest request,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(required = false) String action,
      @RequestParam(defaultValue = "7") int days) {
    audit.recordRead(authentication, "ops.audit.read", request);
    return audit.search(page, size, action, days);
  }
}
