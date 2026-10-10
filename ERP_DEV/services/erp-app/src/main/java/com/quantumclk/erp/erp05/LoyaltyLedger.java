package com.quantumclk.erp.erp05;

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
 * SOW ERP-05: loyalty ledger row. Append-only with running balance; unique
 * per (member, ref) makes earn-on-payment idempotent by construction.
 */
@Entity
@Table(
    name = "loyalty_ledger",
    uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "ref_type", "ref_id"}))
public class LoyaltyLedger {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "member_id", nullable = false)
  private UUID memberId;

  @Column(name = "points_delta", nullable = false)
  private int pointsDelta;

  @Column(name = "balance_after", nullable = false)
  private int balanceAfter;

  @Column(nullable = false, length = 200)
  private String reason;

  @Column(name = "ref_type", nullable = false, length = 50)
  private String refType;

  @Column(name = "ref_id", nullable = false, length = 200)
  private String refId;

  @Column(nullable = false, length = 320)
  private String actor;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected LoyaltyLedger() {}

  public LoyaltyLedger(UUID memberId, int pointsDelta, int balanceAfter, String reason,
      String refType, String refId, String actor) {
    this.memberId = memberId;
    this.pointsDelta = pointsDelta;
    this.balanceAfter = balanceAfter;
    this.reason = reason;
    this.refType = refType;
    this.refId = refId;
    this.actor = actor;
  }

  public UUID getId() {
    return id;
  }

  public UUID getMemberId() {
    return memberId;
  }

  public int getPointsDelta() {
    return pointsDelta;
  }

  public int getBalanceAfter() {
    return balanceAfter;
  }

  public String getReason() {
    return reason;
  }

  public String getRefType() {
    return refType;
  }

  public String getRefId() {
    return refId;
  }
}
