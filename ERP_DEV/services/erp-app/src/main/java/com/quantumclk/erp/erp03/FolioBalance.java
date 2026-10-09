package com.quantumclk.erp.erp03;

import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Folio STUB for 3.3 (real billing lands in 3.4). The settlement gate in
 * StayService is coded against this interface, so 3.4 fills it in without
 * any API change: outstanding balances + folio transfer on room moves.
 */
@Service
public class FolioBalance {

  /** Outstanding paise for a reservation's folio (stub: always settled). */
  public long outstandingFor(UUID reservationId) {
    // TODO(3.4): sum folio entries minus payments for this reservation.
    return 0;
  }

  /** Folio follows the guest across rooms (stub: recorded via audit only). */
  public void noteTransfer(UUID stayId, UUID fromRoomId, UUID toRoomId) {
    // TODO(3.4): re-link folio entries to the new room.
  }
}
