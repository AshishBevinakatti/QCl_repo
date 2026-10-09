package com.quantumclk.erp.erp02;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-02: category reads; writes stay admin-gated in Phase 3.2. */
public interface RoomCategoryRepository extends JpaRepository<RoomCategory, UUID> {

  Page<RoomCategory> findByPropertyId(UUID propertyId, Pageable pageable);
}
