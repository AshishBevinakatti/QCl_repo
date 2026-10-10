package com.quantumclk.erp.erp07;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

/**
 * SOW ERP-07: refund. requested → approved → processed (or rejected);
 * processing is idempotent and capped — the double-refund race test proves
 * exactly one processing wins.
 */
@Entity
@Table(
    name = "refund",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "idempotency_key"}))
public class Refund {

  public static final String REQUESTED = "requested";
  public static final String APPROVED = "approved";
  public static final String PROCESSED = "processed";
  public static final String REJECTED = "rejected";

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "payment_id", nullable = false)
  private UUID paymentId;

  @Column(name = "amount_paise", nullable = false)
  private long amountPaise;

  @Column(length = 500)
  private String reason;

  @Column(length = 320)
  private String approver;

  @Column(nullable = false, length = 50)
  private String status = REQUESTED;

  @Column(name = "idempotency_key", nullable = false, length = 200)
  private String idempotencyKey;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected Refund() {}

  public Refund(UUID propertyId, UUID paymentId, long amountPaise, String reason,
      String idempotencyKey) {
    this.propertyId = propertyId;
    this.paymentId = paymentId;
    this.amountPaise = amountPaise;
    this.reason = reason;
    this.idempotencyKey = idempotencyKey;
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getPaymentId() {
    return paymentId;
  }

  public long getAmountPaise() {
    return amountPaise;
  }

  public String getStatus() {
    return status;
  }

  public void approve(String approver) {
    this.status = APPROVED;
    this.approver = approver;
  }

  public void reject() {
    this.status = REJECTED;
  }

  public void markProcessed() {
    this.status = PROCESSED;
  }
}
