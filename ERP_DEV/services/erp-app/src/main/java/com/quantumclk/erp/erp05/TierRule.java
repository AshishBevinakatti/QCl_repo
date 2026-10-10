package com.quantumclk.erp.erp05;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * SOW ERP-05: tier rules as data ([ASSUMED] seed in V7, admin-extensible).
 * Spend floors gate upgrades; earn rate is points per Rs 100 paid.
 */
@Entity
@Table(name = "tier_rule")
public class TierRule {

  @Id
  private String tier;

  @Column(name = "min_spend_paise", nullable = false)
  private long minSpendPaise;

  @Column(name = "earn_per_rs100", nullable = false)
  private int earnPerRs100 = 1;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String benefits = "{}";

  protected TierRule() {}

  public String getTier() {
    return tier;
  }

  public long getMinSpendPaise() {
    return minSpendPaise;
  }

  public int getEarnPerRs100() {
    return earnPerRs100;
  }
}
