package com.quantumclk.erp.erp04;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * SOW ERP-04: per-guest communication history (what was sent, when, channel).
 * Writes come from Phase 4 notification adapters; the table + mapping land now
 * so the contract is stable.
 */
@Entity
@Table(name = "guest_communication")
public class GuestCommunication {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "guest_id", nullable = false)
  private UUID guestId;

  @Column(nullable = false, length = 50)
  private String channel;

  @Column(nullable = false, length = 200)
  private String template;

  @Column(name = "sent_at", nullable = false)
  private Instant sentAt = Instant.now();

  @Column(nullable = false, length = 50)
  private String status = "sent";

  protected GuestCommunication() {}

  public UUID getId() {
    return id;
  }

  public UUID getGuestId() {
    return guestId;
  }

  public String getChannel() {
    return channel;
  }
}
