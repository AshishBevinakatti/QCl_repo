package com.quantumclk.erp.ops;

import com.quantumclk.erp.audit.AuditEvent;
import com.quantumclk.erp.audit.AuditEventRepository;
import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.common.ApiException;
import com.quantumclk.erp.ops.OpsDtos.AuditDto;
import com.quantumclk.erp.ops.OpsDtos.OpsAuditPage;
import com.quantumclk.erp.ops.logging.LogRedactor;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/** Bounded, redacted audit reads plus deduplicated records of privileged ops reads. */
@Service
public class OpsAuditService {

  private static final Logger log = LoggerFactory.getLogger(OpsAuditService.class);
  private static final UUID PROPERTY_ID =
      UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final Pattern ACTION = Pattern.compile("[A-Za-z0-9._-]{1,100}");
  private static final Duration DEDUPE = Duration.ofSeconds(60);

  private final AuditEventRepository repository;
  private final AuditLog auditLog;
  private final Map<String, Instant> recentReads = new ConcurrentHashMap<>();

  public OpsAuditService(AuditEventRepository repository, AuditLog auditLog) {
    this.repository = repository;
    this.auditLog = auditLog;
  }

  public OpsAuditPage search(int page, int size, String action, int days) {
    int safePage = Math.max(0, page);
    int safeSize = Math.min(100, Math.max(1, size));
    int safeDays = Math.min(90, Math.max(1, days));
    String filter = action == null || action.isBlank() ? null : action.trim();
    if (filter != null && !ACTION.matcher(filter).matches()) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "invalid audit action filter", Map.of());
    }
    Page<AuditEvent> result =
        repository.search(
            PROPERTY_ID,
            filter,
            Instant.now().minus(Duration.ofDays(safeDays)),
            PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
    List<AuditDto> items = result.getContent().stream().map(this::toDto).toList();
    return new OpsAuditPage(
        items, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
  }

  /**
   * Records a successful privileged read at most once per actor/action per minute.
   * Best effort: an audit write failure must not hide the console from an operator,
   * and the failure itself is logged for alerting.
   */
  public void recordRead(Authentication authentication, String action, HttpServletRequest request) {
    String actor = actor(authentication);
    String key = actor + "|" + action;
    Instant now = Instant.now();
    Instant last = recentReads.get(key);
    if (last != null && Duration.between(last, now).compareTo(DEDUPE) < 0) {
      return;
    }
    recentReads.put(key, now);
    if (recentReads.size() > 5000) {
      recentReads.entrySet().removeIf(e -> Duration.between(e.getValue(), now).toMinutes() > 10);
    }
    try {
      auditLog.append(
          PROPERTY_ID,
          actor,
          action,
          "ops",
          "console",
          null,
          null,
          null,
          request == null ? null : request.getRemoteAddr());
    } catch (RuntimeException ex) {
      log.warn("ops audit write failed for action={}", action);
    }
  }

  private String actor(Authentication authentication) {
    if (authentication == null) {
      return "unknown";
    }
    if (authentication.getPrincipal() instanceof Jwt jwt) {
      String preferred = jwt.getClaimAsString("preferred_username");
      if (preferred != null && !preferred.isBlank()) {
        return preferred;
      }
      String subject = jwt.getSubject();
      if (subject != null && !subject.isBlank()) {
        return subject;
      }
    }
    return authentication.getName();
  }

  private AuditDto toDto(AuditEvent event) {
    return new AuditDto(
        event.getId() == null ? null : event.getId().toString(),
        event.getActor(),
        event.getAction(),
        event.getObjectType(),
        event.getObjectId(),
        LogRedactor.redact(event.getBeforeJson()),
        LogRedactor.redact(event.getAfterJson()),
        LogRedactor.redact(event.getReason()),
        event.getCreatedAt() == null ? null : event.getCreatedAt().toString());
  }
}
