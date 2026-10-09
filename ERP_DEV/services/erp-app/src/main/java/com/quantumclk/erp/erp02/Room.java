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
 * SOW ERP-02: physical room. Guests hold a CATEGORY (availability pool);
 * reception assigns a physical room at check-in (3.3). Status is owned by
 * housekeeping (dirty→cleaning→ready); booking counts all physical rooms.
 */
@Entity
@Table(
    name = "room",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "room_no"}))
public class Room {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "category_id", nullable = false)
  private UUID categoryId;

  @Column(name = "room_no", nullable = false, length = 20)
  private String roomNo;

  @Column(nullable = false, length = 50)
  private String status = "ready";

  protected Room() {}

  public UUID getId() {
    return id;
  }

  public UUID getCategoryId() {
    return categoryId;
  }

  public String getRoomNo() {
    return roomNo;
  }

  public String getStatus() {
    return status;
  }
}
