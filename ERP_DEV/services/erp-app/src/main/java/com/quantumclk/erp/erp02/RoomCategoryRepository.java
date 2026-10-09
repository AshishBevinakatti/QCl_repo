package com.quantumclk.erp.erp02;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-02: category reads; writes stay admin-gated in Phase 3.2. */
public interface RoomCategoryRepository extends JpaRepository<RoomCategory, UUID> {

  Page<RoomCategory> findByPropertyId(UUID propertyId, Pageable pageable);

  /**
   * Serialises booking writes per category (the no-double-booking lock).
   * WHY pessimistic: correct on Postgres and H2 alike, works clustered, and
   * the race test proves exactly-one-winner; contention is fine at MVP
   * volumes (Phase 5 load test revisits).
   */
  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT c FROM RoomCategory c WHERE c.id = :id")
  Optional<RoomCategory> lockById(@Param("id") UUID id);
}
