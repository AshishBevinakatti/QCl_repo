package com.quantumclk.erp.erp07;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.config.Configs;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-07: GST invoices. Single tax module, single rounding policy
 * (half-up on the SUBTOTAL — documented here, not spread across callers).
 * Issued invoices are immutable: no update API exists by design.
 */
@Service
public class InvoiceService {

  private final InvoiceRepository invoices;
  private final FolioService folio;
  private final AuditLog auditLog;
  private final Configs configs;

  public InvoiceService(
      InvoiceRepository invoices, FolioService folio, AuditLog auditLog, Configs configs) {
    this.invoices = invoices;
    this.folio = folio;
    this.auditLog = auditLog;
    this.configs = configs;
  }

  @Transactional
  public Invoice issue(UUID propertyId, UUID folioId, String actor, String ip) {
    List<FolioEntry> lines = folio.lines(folioId);
    if (lines.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "folio has no entries");
    }
    long subtotal =
        lines.stream().filter(e -> e.getAmountPaise() > 0).mapToLong(FolioEntry::getAmountPaise).sum();
    long credits =
        -lines.stream().filter(e -> e.getAmountPaise() < 0).mapToLong(FolioEntry::getAmountPaise).sum();
    int gstPct = configs.getInt("tax.gst_pct", 12);
    long tax = (subtotal * gstPct + 50) / 100; // half-up on the subtotal (the documented policy).
    long total = subtotal + tax - credits;
    StringBuilder json = new StringBuilder("[");
    for (int i = 0; i < lines.size(); i++) {
      FolioEntry entry = lines.get(i);
      if (i > 0) {
        json.append(",");
      }
      json.append("{\"source\":\"").append(entry.getSourceType()).append("\",\"amount\":")
          .append(entry.getAmountPaise()).append("}");
    }
    json.append("]");
    Invoice invoice = invoices.save(new Invoice(propertyId, folioId, json.toString(), tax, total));
    auditLog.append(propertyId, actor, "invoice.issued", "invoice", invoice.getId().toString(),
        null, "total=" + total, null, ip);
    return invoice;
  }
}
