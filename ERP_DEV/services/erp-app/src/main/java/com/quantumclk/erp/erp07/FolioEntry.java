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
 * SOW ERP-07: folio line. Signed amounts (charges +, payments/credits −),
 * append-only — corrections are new entries, never edits.
 */
@Entity
@Table(name = "folio_entry")
public class FolioEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "folio_id", nullable = false)
  private UUID folioId;

  @Column(name = "source_type", nullable = false, length = 50)
  private String sourceType;

  @Column(name = "source_id", nullable = false, length = 200)
  private String sourceId;

  @Column(name = "amount_paise", nullable = false)
  private long amountPaise;

  @Column(nullable = false, length = 320)
  private String actor;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected FolioEntry() {}

  public FolioEntry(UUID folioId, String sourceType, String sourceId, long amountPaise,
      String actor) {
    this.folioId = folioId;
    this.sourceType = sourceType;
    this.sourceId = sourceId;
    this.amountPaise = amountPaise;
    this.actor = actor;
  }

  public UUID getId() {
    return id;
  }

  public UUID getFolioId() {
    return folioId;
  }

  public String getSourceType() {
    return sourceType;
  }

  public String getSourceId() {
    return sourceId;
  }

  public long getAmountPaise() {
    return amountPaise;
  }
}
