package com.quantumclk.erp.erp07;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-07: invoice reads (no updates exist — invoices are immutable). */
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

  List<Invoice> findByFolioIdOrderByIssuedAtDesc(UUID folioId);
}
