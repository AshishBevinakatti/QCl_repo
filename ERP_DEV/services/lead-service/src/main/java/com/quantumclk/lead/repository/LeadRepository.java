package com.quantumclk.lead.repository;

import com.quantumclk.lead.domain.Lead;
import com.quantumclk.lead.domain.LeadStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {
    Optional<Lead> findByPublicReference(String publicReference);

    Page<Lead> findByStatus(LeadStatus status, Pageable pageable);

    List<Lead> findByPortalGuestIdOrderByCreatedAtDesc(UUID portalGuestId);

    @Query("SELECT l FROM Lead l WHERE l.status = 'NEW' AND l.slaDeadline <= :now AND l.voiceEscalationTriggered = false")
    List<Lead> findPendingVoiceEscalations(@Param("now") OffsetDateTime now);

    long countByStatus(LeadStatus status);
}
