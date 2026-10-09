package com.quantumclk.erp.audit;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/** Audit reads (writes go through AuditLog so no entry is ever skipped). */
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

  Page<AuditEvent> findByPropertyIdOrderByCreatedAtDesc(UUID propertyId, Pageable pageable);
}
