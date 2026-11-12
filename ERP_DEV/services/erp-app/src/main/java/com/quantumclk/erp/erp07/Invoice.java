package com.quantumclk.erp.erp07;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * SOW ERP-07: invoice. Immutable once issued — corrections are credit-note
 * folio entries plus a NEW invoice, never an edit (no update API exists).
 */
@Entity
@Table(name = "invoice")
public class Invoice {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "folio_id", nullable = false)
  private UUID folioId;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String lines;

  @Column(name = "tax_paise", nullable = false)
  private long taxPaise;

  @Column(name = "total_paise", nullable = false)
  private long totalPaise;

  @Column(nullable = false, length = 50)
  private String status = "issued";

  @Column(name = "issued_at", nullable = false)
  private Instant issuedAt = Instant.now();

  protected Invoice() {}

  public Invoice(UUID propertyId, UUID folioId, String lines, long taxPaise, long totalPaise) {
    this.propertyId = propertyId;
    this.folioId = folioId;
    this.lines = lines;
    this.taxPaise = taxPaise;
    this.totalPaise = totalPaise;
  }

  public UUID getId() {
    return id;
  }

  public UUID getFolioId() {
    return folioId;
  }

  public String getLines() {
    return lines;
  }

  public long getTaxPaise() {
    return taxPaise;
  }

  public long getTotalPaise() {
    return totalPaise;
  }

  public String getStatus() {
    return status;
  }

  public Instant getIssuedAt() {
    return issuedAt;
  }
}
