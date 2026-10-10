package com.quantumclk.erp.erp07;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-07: folio reads (writes go through FolioService — append-only). */
public interface FolioRepository extends JpaRepository<Folio, UUID> {

  Optional<Folio> findByStayId(UUID stayId);

  List<Folio> findByGuestId(UUID guestId);
}
