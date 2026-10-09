package com.quantumclk.erp.audit;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Single audit writer for all modules (SOW ERP-08). Call it in the same
 * transaction as the business write — a missing audit entry is a defect.
 */
@Service
public class AuditLog {

  private final AuditEventRepository repository;

  public AuditLog(AuditEventRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public AuditEvent append(
      UUID propertyId,
      String actor,
      String action,
      String objectType,
      String objectId,
      String beforeJson,
      String afterJson,
      String reason,
      String sourceIp) {
    return repository.save(
        new AuditEvent(
            propertyId, actor, action, objectType, objectId, beforeJson, afterJson, reason,
            sourceIp));
  }
}
