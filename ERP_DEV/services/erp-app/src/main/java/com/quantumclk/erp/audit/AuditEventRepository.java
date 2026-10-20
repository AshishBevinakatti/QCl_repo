package com.quantumclk.erp.audit;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Audit reads (writes go through AuditLog so no entry is ever skipped). */
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

  Page<AuditEvent> findByPropertyIdOrderByCreatedAtDesc(UUID propertyId, Pageable pageable);

  @Query(
      """
      SELECT a FROM AuditEvent a
      WHERE a.propertyId = :propertyId
        AND (:action IS NULL OR a.action = :action)
        AND a.createdAt >= :since
      """)
  Page<AuditEvent> search(
      @Param("propertyId") UUID propertyId,
      @Param("action") String action,
      @Param("since") Instant since,
      Pageable pageable);
}
