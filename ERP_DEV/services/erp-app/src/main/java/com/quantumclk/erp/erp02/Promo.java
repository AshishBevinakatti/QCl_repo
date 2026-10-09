package com.quantumclk.erp.erp02;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.UUID;

/**
 * SOW ERP-02: promo codes with validity window + usage cap (usage-tracked,
 * unlike the flat V2 `pricing.promos` config row it replaces for quotes).
 */
@Entity
@Table(
    name = "promo",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "code"}))
public class Promo {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(nullable = false, length = 50)
  private String code;

  @Column(name = "pct_bps", nullable = false)
  private int pctBps;

  @Column(name = "valid_from", nullable = false)
  private LocalDate validFrom;

  @Column(name = "valid_to", nullable = false)
  private LocalDate validTo;

  @Column(name = "max_uses", nullable = false)
  private int maxUses;

  @Column(name = "used_count", nullable = false)
  private int usedCount;

  protected Promo() {}

  public String getCode() {
    return code;
  }

  public int getPctBps() {
    return pctBps;
  }

  /** Usable today (date window open and cap not reached)? */
  public boolean usableOn(LocalDate today) {
    return !today.isBefore(validFrom) && !today.isAfter(validTo) && usedCount < maxUses;
  }

  public void recordUse() {
    usedCount++;
  }
}
