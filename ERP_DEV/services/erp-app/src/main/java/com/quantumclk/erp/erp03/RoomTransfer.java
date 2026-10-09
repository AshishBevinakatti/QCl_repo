package com.quantumclk.erp.erp03;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * SOW ERP-03: room-transfer ledger (append-only). The folio follows the guest
 * (folio link is a 3.4 stub — see FolioBalance); this table proves the move.
 */
@Entity
@Table(name = "room_transfer")
public class RoomTransfer {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "stay_id", nullable = false)
  private UUID stayId;

  @Column(name = "from_room_id", nullable = false)
  private UUID fromRoomId;

  @Column(name = "to_room_id", nullable = false)
  private UUID toRoomId;

  @Column(nullable = false, length = 320)
  private String actor;

  @Column(length = 500)
  private String reason;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected RoomTransfer() {}

  public RoomTransfer(UUID stayId, UUID fromRoomId, UUID toRoomId, String actor, String reason) {
    this.stayId = stayId;
    this.fromRoomId = fromRoomId;
    this.toRoomId = toRoomId;
    this.actor = actor;
    this.reason = reason;
  }
}
