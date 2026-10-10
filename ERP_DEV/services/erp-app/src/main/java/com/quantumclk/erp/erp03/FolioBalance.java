package com.quantumclk.erp.erp03;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.erp07.FolioService;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Folio facade for front-office gates (was a stub in 3.3, real since 3.4 —
 * same call sites). Balances derive from folio entries; transfers are
 * audit-trailed (the folio follows the stay, which follows the guest).
 */
@Service
public class FolioBalance {

  private final FolioService folio;
  private final StayRepository stays;
  private final AuditLog auditLog;

  public FolioBalance(FolioService folio, StayRepository stays, AuditLog auditLog) {
    this.folio = folio;
    this.stays = stays;
    this.auditLog = auditLog;
  }

  /** Outstanding paise for a reservation's folio (0 when no folio exists yet). */
  public long outstandingFor(UUID reservationId) {
    return stays.findAll().stream()
        .filter(s -> reservationId.equals(s.getReservationId()))
        .findFirst()
        .map(s -> folio.outstandingForStay(s.getId()))
        .orElse(0L);
  }

  /** Folio follows the guest across rooms (folio is stay-scoped, so this audits the move). */
  public void noteTransfer(UUID stayId, UUID fromRoomId, UUID toRoomId, String actor, String ip) {
    stays.findById(stayId).ifPresent(
        stay -> auditLog.append(stay.getPropertyId(), actor, "folio.transfer-noted", "folio",
            stayId.toString(), fromRoomId.toString(), toRoomId.toString(), null, ip));
  }
}
