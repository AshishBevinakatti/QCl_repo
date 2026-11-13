package com.quantumclk.lead.notification;

import com.quantumclk.lead.domain.Lead;
import com.quantumclk.lead.domain.LeadActivity;
import com.quantumclk.lead.domain.NotificationStatus;
import com.quantumclk.lead.domain.WhatsAppNotification;
import com.quantumclk.lead.notification.StaffDirectory.StaffContact;
import com.quantumclk.lead.repository.LeadActivityRepository;
import com.quantumclk.lead.repository.WhatsAppNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Transactional outbox for WhatsApp lead alerts:
 * queue rows with the lead (same transaction), send them from a scheduled job, track status from Meta webhooks.
 */
@Service
public class WhatsAppNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationService.class);
    private static final String ACTOR = "SYSTEM_WHATSAPP";
    static final int MAX_ATTEMPTS = 3;
    private static final int BATCH_SIZE = 10;

    private final WhatsAppProperties props;
    private final WhatsAppSender sender;
    private final StaffDirectory staff;
    private final WhatsAppNotificationRepository notifications;
    private final LeadActivityRepository activities;

    public WhatsAppNotificationService(WhatsAppProperties props, WhatsAppSender sender, StaffDirectory staff,
                                       WhatsAppNotificationRepository notifications, LeadActivityRepository activities) {
        this.props = props;
        this.sender = sender;
        this.staff = staff;
        this.notifications = notifications;
        this.activities = activities;
    }

    /** Called inside the lead-creation transaction. Never throws: a WhatsApp problem must not block an enquiry. */
    @Transactional
    public void queueNewLeadAlerts(Lead lead) {
        if (!props.enabled()) {
            return;
        }
        if (!staff.configured()) {
            note(lead, "WHATSAPP_SKIPPED", "WhatsApp alert skipped: staff directory (Keycloak client) not configured");
            return;
        }
        List<StaffContact> recipients;
        try {
            recipients = staff.onDutySalesStaff();
        } catch (RuntimeException e) {
            // shortcut: a Keycloak outage at intake skips the alert (the 5-minute voice escalation still fires); queue a fan-out row if that proves too lossy.
            log.error("WhatsApp alert skipped for lead {}: staff directory lookup failed ({})", lead.getPublicReference(), e.getClass().getSimpleName());
            note(lead, "WHATSAPP_SKIPPED", "WhatsApp alert skipped: staff directory unavailable");
            return;
        }
        if (recipients.isEmpty()) {
            note(lead, "WHATSAPP_SKIPPED", "WhatsApp alert skipped: no on-duty sales staff");
            return;
        }
        OffsetDateTime now = OffsetDateTime.now();
        for (StaffContact c : recipients) {
            String digits = PhoneNumbers.normalize(c.phone());
            if (digits == null) {
                note(lead, "WHATSAPP_SKIPPED", "WhatsApp alert skipped for " + c.username() + ": invalid phone number");
                continue;
            }
            if (notifications.existsByLeadIdAndRecipientUsernameAndTemplateName(lead.getId(), c.username(), props.templateName())) {
                continue;
            }
            notifications.save(new WhatsAppNotification(lead, c.username(), PhoneNumbers.mask(digits),
                sender.providerName(), props.templateName(), now));
        }
    }

    // shortcut: the HTTP call runs inside the row-lock transaction; fine at resort volume (batch of 10), move to claim-then-send if batches grow.
    @Scheduled(fixedDelayString = "${app.whatsapp.dispatch-interval-ms:5000}",
               initialDelayString = "${app.whatsapp.dispatch-initial-delay-ms:5000}")
    @Transactional
    public void dispatchDue() {
        if (!props.enabled()) {
            return;
        }
        OffsetDateTime now = OffsetDateTime.now();
        for (WhatsAppNotification n : notifications.lockDue(NotificationStatus.PENDING, now, PageRequest.of(0, BATCH_SIZE))) {
            dispatch(n, now);
        }
    }

    private void dispatch(WhatsAppNotification n, OffsetDateTime now) {
        n.setAttempts(n.getAttempts() + 1);
        n.setUpdatedAt(now);
        try {
            StaffContact c = staff.findByUsername(n.getRecipientUsername())
                .orElseThrow(() -> new WhatsAppSendException(false, "RECIPIENT_UNAVAILABLE", "Recipient not found or disabled in staff directory"));
            String to = PhoneNumbers.normalize(c.phone());
            if (to == null) {
                throw new WhatsAppSendException(false, "INVALID_PHONE", "Recipient phone number is not a valid E.164 number");
            }
            Lead lead = n.getLead();
            String messageId = sender.send(to, n.getTemplateName(), props.templateLanguage(), List.of(
                clean(c.displayName()),
                clean(lead.getName()),
                clean(lead.getPhone()),
                clean(lead.getRoomCategory()),
                lead.getPublicReference()
            ));
            n.setWaMessageId(messageId);
            n.setStatus(NotificationStatus.ACCEPTED);
            n.setErrorCode(null);
            n.setErrorMessage(null);
        } catch (WhatsAppSendException e) {
            fail(n, e, now);
        } catch (RuntimeException e) {
            fail(n, new WhatsAppSendException(true, "INTERNAL", e.getClass().getSimpleName()), now);
        }
    }

    private void fail(WhatsAppNotification n, WhatsAppSendException e, OffsetDateTime now) {
        n.setErrorCode(e.code());
        n.setErrorMessage(e.getMessage());
        if (e.retryable() && n.getAttempts() < MAX_ATTEMPTS) {
            n.setNextAttemptAt(now.plusSeconds(30L << (n.getAttempts() - 1)));
            log.warn("WhatsApp send to {} for lead {} failed ({}), retry {}/{}", n.getRecipientPhoneMasked(),
                n.getLead().getPublicReference(), e.code(), n.getAttempts(), MAX_ATTEMPTS);
            return;
        }
        n.setStatus(NotificationStatus.FAILED);
        log.error("WhatsApp send to {} for lead {} failed permanently ({})", n.getRecipientPhoneMasked(),
            n.getLead().getPublicReference(), e.code());
        note(n.getLead(), "WHATSAPP_FAILED", "WhatsApp alert to " + n.getRecipientUsername() + " failed: " + e.code());
    }

    /** Applies a Meta webhook status. Returns false for unknown ids, unknown statuses, duplicates and out-of-order events. */
    @Transactional
    public boolean applyStatus(String waMessageId, String metaStatus, String errorCode, String errorTitle) {
        NotificationStatus next = switch (metaStatus == null ? "" : metaStatus) {
            case "sent" -> NotificationStatus.SENT;
            case "delivered" -> NotificationStatus.DELIVERED;
            case "read" -> NotificationStatus.READ;
            case "failed" -> NotificationStatus.FAILED;
            default -> null;
        };
        if (next == null) {
            return false;
        }
        WhatsAppNotification n = notifications.findByWaMessageId(waMessageId).orElse(null);
        if (n == null) {
            log.info("WhatsApp webhook for unknown message id {} ignored", waMessageId);
            return false;
        }
        if (next.rank() <= n.getStatus().rank()) {
            return false;
        }
        n.setStatus(next);
        n.setUpdatedAt(OffsetDateTime.now());
        if (next == NotificationStatus.FAILED) {
            n.setErrorCode(errorCode == null ? "META_FAILED" : "META_" + errorCode);
            n.setErrorMessage(errorTitle);
            note(n.getLead(), "WHATSAPP_FAILED", "WhatsApp alert to " + n.getRecipientUsername() + " was not delivered: " + n.getErrorCode());
        }
        return true;
    }

    /** Meta rejects template parameters with newlines, tabs or more than 4 consecutive spaces. */
    static String clean(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value.replaceAll("[\\r\\n\\t]+", " ").replaceAll(" {4,}", "   ").trim();
    }

    private void note(Lead lead, String type, String description) {
        activities.save(new LeadActivity(UUID.randomUUID(), lead, ACTOR, type, description, OffsetDateTime.now()));
    }
}
