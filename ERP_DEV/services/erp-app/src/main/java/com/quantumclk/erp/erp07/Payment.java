package com.quantumclk.erp.erp07;

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
 * SOW ERP-07: payment. Confirmed ONLY via signed gateway callback (or the
 * sandbox simulator) — never by client claim. Idempotent by key.
 */
@Entity
@Table(
    name = "payment",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "idempotency_key"}))
public class Payment {

  public static final String PENDING = "pending";
  public static final String CAPTURED = "captured";
  public static final String FAILED = "failed";

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "folio_id")
  private UUID folioId;

  @Column(name = "booking_id")
  private UUID bookingId;

  @Column(name = "amount_paise", nullable = false)
  private long amountPaise;

  @Column(nullable = false, length = 3)
  private String currency = "INR";

  @Column(nullable = false, length = 50)
  private String status = PENDING;

  @Column(name = "gateway_ref", length = 200)
  private String gatewayRef;

  @Column(name = "idempotency_key", nullable = false, length = 200)
  private String idempotencyKey;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected Payment() {}

  public Payment(UUID propertyId, UUID folioId, UUID bookingId, long amountPaise,
      String gatewayRef, String idempotencyKey) {
    this.propertyId = propertyId;
    this.folioId = folioId;
    this.bookingId = bookingId;
    this.amountPaise = amountPaise;
    this.gatewayRef = gatewayRef;
    this.idempotencyKey = idempotencyKey;
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getFolioId() {
    return folioId;
  }

  public UUID getBookingId() {
    return bookingId;
  }

  public long getAmountPaise() {
    return amountPaise;
  }

  public String getStatus() {
    return status;
  }

  public String getGatewayRef() {
    return gatewayRef;
  }

  public void capture() {
    this.status = CAPTURED;
  }

  public void linkFolio(UUID folioId) {
    this.folioId = folioId;
  }

  public void fail() {
    this.status = FAILED;
  }
}
