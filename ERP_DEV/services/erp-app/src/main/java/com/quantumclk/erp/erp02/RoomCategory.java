package com.quantumclk.erp.erp02;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/**
 * SOW ERP-02 (booking): room category master. Money as paise integer (never
 * float); rows are property-scoped (see docs/02-architecture/data-model.md).
 * Rates/seasons/promos build on this table in Phase 3.2.
 */
@Entity
@Table(
    name = "room_category",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "name"}))
public class RoomCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(nullable = false)
  private String name;

  @Column(name = "base_price_paise", nullable = false)
  private long basePricePaise;

  @Column(nullable = false)
  private int capacity;

  protected RoomCategory() {}

  public RoomCategory(UUID propertyId, String name, long basePricePaise, int capacity) {
    this.propertyId = propertyId;
    this.name = name;
    this.basePricePaise = basePricePaise;
    this.capacity = capacity;
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public String getName() {
    return name;
  }

  public long getBasePricePaise() {
    return basePricePaise;
  }

  public int getCapacity() {
    return capacity;
  }
}
