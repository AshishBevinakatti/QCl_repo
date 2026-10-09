package com.quantumclk.erp.erp02;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * SOW ERP-02: hold expiry marker. A hold older than `booking.hold_minutes`
 * releases its inventory via the sweeper (HoldExpiryJob) — the safety net
 * behind the no-double-booking guarantee.
 */
@Entity
@Table(name = "reservation_hold")
public class ReservationHold {

  @Id
  @Column(name = "reservation_id")
  private UUID reservationId;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  protected ReservationHold() {}

  public ReservationHold(UUID reservationId, Instant expiresAt) {
    this.reservationId = reservationId;
    this.expiresAt = expiresAt;
  }

  public UUID getReservationId() {
    return reservationId;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }
}
