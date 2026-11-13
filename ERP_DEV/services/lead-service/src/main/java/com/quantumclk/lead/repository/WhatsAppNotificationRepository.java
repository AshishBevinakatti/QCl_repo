package com.quantumclk.lead.repository;

import com.quantumclk.lead.domain.NotificationStatus;
import com.quantumclk.lead.domain.WhatsAppNotification;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WhatsAppNotificationRepository extends JpaRepository<WhatsAppNotification, UUID> {

    // lock.timeout -2 = SKIP LOCKED on Postgres: two lead-service instances never pick the same row.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2"))
    @Query("SELECT n FROM WhatsAppNotification n WHERE n.status = :status AND n.nextAttemptAt <= :now ORDER BY n.nextAttemptAt")
    List<WhatsAppNotification> lockDue(@Param("status") NotificationStatus status, @Param("now") OffsetDateTime now, Pageable page);

    Optional<WhatsAppNotification> findByWaMessageId(String waMessageId);

    boolean existsByLeadIdAndRecipientUsernameAndTemplateName(UUID leadId, String recipientUsername, String templateName);

    List<WhatsAppNotification> findByLeadId(UUID leadId);
}
