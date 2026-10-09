package com.quantumclk.erp.erp03;

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
 * SOW ERP-03: a stay binds one reservation to one physical room.
 * One reservation → at most one stay (unique); one room → one active stay
 * (guarded by query + row lock in StayService, proven by the race test).
 */
@Entity
@Table(
    name = "stay",
    uniqueConstraints = @UniqueConstraint(columnNames = "reservation_id"))
public class Stay {

  public static final String CHECKED_IN = "checked-in";
  public static final String CHECKED_OUT = "checked-out";

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "reservation_id", nullable = false)
  private UUID reservationId;

  @Column(name = "room_id", nullable = false)
  private UUID roomId;

  @Column(name = "checkin_at", nullable = false)
  private Instant checkinAt = Instant.now();

  @Column(name = "checkout_at")
  private Instant checkoutAt;

  @Column(nullable = false, length = 50)
  private String status = CHECKED_IN;

  protected Stay() {}

  public Stay(UUID propertyId, UUID reservationId, UUID roomId) {
    this.propertyId = propertyId;
    this.reservationId = reservationId;
    this.roomId = roomId;
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getReservationId() {
    return reservationId;
  }

  public UUID getRoomId() {
    return roomId;
  }

  public void setRoomId(UUID roomId) {
    this.roomId = roomId;
  }

  public String getStatus() {
    return status;
  }

  public void checkOut() {
    this.status = CHECKED_OUT;
    this.checkoutAt = Instant.now();
  }
}
