package com.quantumclk.erp.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Append-only audit row (see data-model.md). Written in the same transaction
 * as the business change — never updated or deleted by application code.
 */
@Entity
@Table(name = "audit_event")
public class AuditEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(nullable = false)
  private String actor;

  @Column(nullable = false)
  private String action;

  @Column(name = "object_type", nullable = false)
  private String objectType;

  @Column(name = "object_id", nullable = false)
  private String objectId;

  @Column(name = "before_json", columnDefinition = "TEXT")
  private String beforeJson;

  @Column(name = "after_json", columnDefinition = "TEXT")
  private String afterJson;

  @Column(length = 500)
  private String reason;

  @Column(name = "source_ip", length = 100)
  private String sourceIp;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected AuditEvent() {}

  public AuditEvent(
      UUID propertyId,
      String actor,
      String action,
      String objectType,
      String objectId,
      String beforeJson,
      String afterJson,
      String reason,
      String sourceIp) {
    this.propertyId = propertyId;
    this.actor = actor;
    this.action = action;
    this.objectType = objectType;
    this.objectId = objectId;
    this.beforeJson = beforeJson;
    this.afterJson = afterJson;
    this.reason = reason;
    this.sourceIp = sourceIp;
  }

  public UUID getId() {
    return id;
  }

  public String getAction() {
    return action;
  }

  public String getActor() {
    return actor;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public String getObjectType() {
    return objectType;
  }

  public String getObjectId() {
    return objectId;
  }

  public String getBeforeJson() {
    return beforeJson;
  }

  public String getAfterJson() {
    return afterJson;
  }

  public String getReason() {
    return reason;
  }

  public String getSourceIp() {
    return sourceIp;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
