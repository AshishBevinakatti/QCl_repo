package com.quantumclk.erp.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * SOW ERP-08: admin-editable business rules (rates, tax, tiers, policies).
 * Values are TEXT (JSON for structured ones) so client answers swap config,
 * never code (Rule 2 placeholder policy; D-101…D-114).
 */
@Entity
@Table(name = "app_config")
public class AppConfig {

  @Id
  @Column(name = "config_key")
  private String key;

  @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
  private String value;

  @Column(name = "effective_from", nullable = false)
  private Instant effectiveFrom = Instant.now();

  @Column(name = "updated_by", nullable = false)
  private String updatedBy = "seed";

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected AppConfig() {}

  public AppConfig(String key, String value, String updatedBy) {
    this.key = key;
    this.value = value;
    this.updatedBy = updatedBy;
  }

  public String getKey() {
    return key;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String value, String updatedBy) {
    this.value = value;
    this.updatedBy = updatedBy;
    this.updatedAt = Instant.now();
    this.effectiveFrom = Instant.now();
  }

  public String getUpdatedBy() {
    return updatedBy;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
