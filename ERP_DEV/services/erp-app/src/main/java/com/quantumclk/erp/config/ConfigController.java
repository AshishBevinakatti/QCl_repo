package com.quantumclk.erp.config;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.erp02.RoomCategoryController;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-08 (REQ-ERP08-005): configuration panel API. Reads need any login;
 * writes need SUPERADMIN and always write an audit entry (before/after).
 */
@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

  private final AppConfigRepository repository;
  private final AuditLog auditLog;

  public ConfigController(AppConfigRepository repository, AuditLog auditLog) {
    this.repository = repository;
    this.auditLog = auditLog;
  }

  @GetMapping
  public List<EntryDto> list() {
    return repository.findAll().stream()
        .map(c -> new EntryDto(c.getKey(), c.getValue()))
        .toList();
  }

  @PreAuthorize("hasAuthority('SUPERADMIN')")
  @PatchMapping("/{key}")
  public EntryDto update(
      @PathVariable String key, @RequestBody Map<String, String> body, HttpServletRequest req) {
    AppConfig cfg =
        repository
            .findById(key)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "config key not found"));
    String before = cfg.getValue();
    String actor = req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "unknown";
    cfg.setValue(body.getOrDefault("value", before), actor);
    repository.save(cfg);
    auditLog.append(
        RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID,
        actor,
        "config.changed",
        "app_config",
        key,
        before,
        cfg.getValue(),
        body.get("reason"),
        req.getRemoteAddr());
    return new EntryDto(cfg.getKey(), cfg.getValue());
  }

  public record EntryDto(String key, String value) {}
}
