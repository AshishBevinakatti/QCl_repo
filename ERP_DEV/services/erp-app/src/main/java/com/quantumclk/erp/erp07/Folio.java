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
 * SOW ERP-07: folio — one account per stay (or per guest for pre-stay fees).
 * Charges and payments append as signed entries; the balance is derived,
 * never stored (so it cannot drift).
 */
@Entity
@Table(name = "folio")
public class Folio {

  public static final String OPEN = "open";
  public static final String SETTLING = "settling";
  public static final String SETTLED = "settled";

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "guest_id", nullable = false)
  private UUID guestId;

  @Column(name = "stay_id")
  private UUID stayId;

  @Column(name = "member_id")
  private UUID memberId;

  @Column(nullable = false, length = 50)
  private String status = OPEN;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected Folio() {}

  public Folio(UUID propertyId, UUID guestId, UUID stayId) {
    this.propertyId = propertyId;
    this.guestId = guestId;
    this.stayId = stayId;
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getGuestId() {
    return guestId;
  }

  public UUID getStayId() {
    return stayId;
  }

  public String getStatus() {
    return status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
