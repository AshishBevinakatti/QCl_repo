package com.quantumclk.erp.erp07;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-07: folio lines (the balance is always derived, never stored). */
public interface FolioEntryRepository extends JpaRepository<FolioEntry, UUID> {

  List<FolioEntry> findByFolioIdOrderByCreatedAtAsc(UUID folioId);
}
