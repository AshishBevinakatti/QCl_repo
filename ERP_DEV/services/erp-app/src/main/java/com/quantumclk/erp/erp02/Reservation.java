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
 * SOW ERP-02: reservation. Holds a CATEGORY (pool model); `room_id` is filled
 * at check-in (3.3). The quoted total is snapshotted (price-lock): later
 * config changes never move a confirmed quote — modification re-quotes.
 */
@Entity
@Table(
    name = "reservation",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "idempotency_key"}))
public class Reservation {

  public static final String HOLD = "hold";
  public static final String CONFIRMED = "confirmed";
  public static final String CHECKED_IN = "checked-in";
  public static final String CHECKED_OUT = "checked-out";
  public static final String CANCELLED = "cancelled";
  public static final String EXPIRED = "expired";

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "guest_id", nullable = false)
  private UUID guestId;

  @Column(name = "category_id", nullable = false)
  private UUID categoryId;

  @Column(name = "room_id")
  private UUID roomId;

  @Column(name = "checkin_date", nullable = false)
  private LocalDate checkinDate;

  @Column(name = "checkout_date", nullable = false)
  private LocalDate checkoutDate;

  @Column(nullable = false)
  private int nights;

  @Column(name = "quoted_total_paise", nullable = false)
  private long quotedTotalPaise;

  @Column(name = "advance_due_paise", nullable = false)
  private long advanceDuePaise;

  @Column(name = "cancellation_fee_paise", nullable = false)
  private long cancellationFeePaise;

  @Column(nullable = false, length = 50)
  private String status = HOLD;

  @Column(nullable = false, length = 50)
  private String source = "web";

  @Column(name = "idempotency_key", nullable = false, length = 200)
  private String idempotencyKey;

  protected Reservation() {}

  public Reservation(
      UUID propertyId,
      UUID guestId,
      UUID categoryId,
      LocalDate checkinDate,
      LocalDate checkoutDate,
      int nights,
      long quotedTotalPaise,
      long advanceDuePaise,
      String source,
      String idempotencyKey) {
    this.propertyId = propertyId;
    this.guestId = guestId;
    this.categoryId = categoryId;
    this.checkinDate = checkinDate;
    this.checkoutDate = checkoutDate;
    this.nights = nights;
    this.quotedTotalPaise = quotedTotalPaise;
    this.advanceDuePaise = advanceDuePaise;
    this.source = source;
    this.idempotencyKey = idempotencyKey;
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

  public UUID getCategoryId() {
    return categoryId;
  }

  public LocalDate getCheckinDate() {
    return checkinDate;
  }

  public LocalDate getCheckoutDate() {
    return checkoutDate;
  }

  public int getNights() {
    return nights;
  }

  public long getQuotedTotalPaise() {
    return quotedTotalPaise;
  }

  public long getAdvanceDuePaise() {
    return advanceDuePaise;
  }

  public long getCancellationFeePaise() {
    return cancellationFeePaise;
  }

  public String getStatus() {
    return status;
  }

  public String getSource() {
    return source;
  }

  public void requote(LocalDate checkinDate, LocalDate checkoutDate, int nights, long total) {
    this.checkinDate = checkinDate;
    this.checkoutDate = checkoutDate;
    this.nights = nights;
    this.quotedTotalPaise = total;
  }

  public void confirm() {
    this.status = CONFIRMED;
  }

  public void cancel(long feePaise) {
    this.status = CANCELLED;
    this.cancellationFeePaise = feePaise;
  }

  public void expire() {
    this.status = EXPIRED;
  }

  /** One-night charge for late cancellation (integer paise, rounds down). */
  public long oneNightRate() {
    return nights > 0 ? quotedTotalPaise / nights : quotedTotalPaise;
  }
}
