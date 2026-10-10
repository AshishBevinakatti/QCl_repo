package com.quantumclk.erp.erp07;

import com.quantumclk.erp.audit.AuditLog;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SOW ERP-07: folio engine. Balances are always derived (entries − payments
 * never stored), so they cannot drift. Replaces the 3.3 FolioBalance stub —
 * same call sites, now real.
 */
@Service
public class FolioService {

  private final FolioRepository folios;
  private final FolioEntryRepository entries;
  private final PaymentRepository payments;
  private final AuditLog auditLog;

  public FolioService(
      FolioRepository folios,
      FolioEntryRepository entries,
      PaymentRepository payments,
      AuditLog auditLog) {
    this.folios = folios;
    this.entries = entries;
    this.payments = payments;
    this.auditLog = auditLog;
  }

  @Transactional
  public Folio ensureForStay(UUID propertyId, UUID guestId, UUID stayId) {
    return folios.findByStayId(stayId)
        .orElseGet(() -> folios.save(new Folio(propertyId, guestId, stayId)));
  }

  @Transactional
  public Folio ensureForGuest(UUID propertyId, UUID guestId) {
    List<Folio> open =
        folios.findByGuestId(guestId).stream()
            .filter(f -> Folio.OPEN.equals(f.getStatus()) && f.getStayId() == null)
            .toList();
    return open.stream()
        .findFirst()
        .orElseGet(() -> folios.save(new Folio(propertyId, guestId, null)));
  }

  /** Append a signed entry (charges +, payments/credits −); returns the entry. */
  @Transactional
  public FolioEntry postEntry(UUID folioId, String sourceType, String sourceId, long amountPaise,
      String actor) {
    Folio folio =
        folios.findById(folioId)
            .orElseThrow(() -> new IllegalArgumentException("folio not found"));
    FolioEntry entry = entries.save(new FolioEntry(folioId, sourceType, sourceId, amountPaise, actor));
    auditLog.append(folio.getPropertyId(), actor, "folio.entry-posted", "folio",
        folioId.toString(), null, sourceType + "=" + amountPaise, null, null);
    return entry;
  }

  /** Outstanding paise for a folio (positive = guest owes). */
  @Transactional(readOnly = true)
  public long outstanding(UUID folioId) {
    return entries.findByFolioIdOrderByCreatedAtAsc(folioId).stream()
        .mapToLong(FolioEntry::getAmountPaise)
        .sum();
  }

  public List<FolioEntry> lines(UUID folioId) {
    return entries.findByFolioIdOrderByCreatedAtAsc(folioId);
  }

  /** Folio for a stay, if one was opened (room charges post at check-in). */
  public java.util.Optional<Folio> findForStay(UUID stayId) {
    return folios.findByStayId(stayId);
  }

  /** Outstanding paise for a stay's folio (0 when no folio exists yet). */
  public long outstandingForStay(UUID stayId) {
    return findForStay(stayId).map(f -> outstanding(f.getId())).orElse(0L);
  }
}
