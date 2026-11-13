package com.quantumclk.lead.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "whatsapp_notification")
public class WhatsAppNotification {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @Column(name = "recipient_username", nullable = false, length = 100)
    private String recipientUsername;

    @Column(name = "recipient_phone_masked", nullable = false, length = 30)
    private String recipientPhoneMasked;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;

    @Column(name = "wa_message_id", unique = true, length = 128)
    private String waMessageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationStatus status;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "next_attempt_at", nullable = false)
    private OffsetDateTime nextAttemptAt;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", length = 300)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public WhatsAppNotification() {
    }

    public WhatsAppNotification(Lead lead, String recipientUsername, String recipientPhoneMasked,
                                String provider, String templateName, OffsetDateTime now) {
        this.id = UUID.randomUUID();
        this.lead = lead;
        this.recipientUsername = recipientUsername;
        this.recipientPhoneMasked = recipientPhoneMasked;
        this.provider = provider;
        this.templateName = templateName;
        this.status = NotificationStatus.PENDING;
        this.nextAttemptAt = now;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public Lead getLead() { return lead; }
    public String getRecipientUsername() { return recipientUsername; }
    public String getRecipientPhoneMasked() { return recipientPhoneMasked; }
    public String getProvider() { return provider; }
    public String getTemplateName() { return templateName; }

    public String getWaMessageId() { return waMessageId; }
    public void setWaMessageId(String waMessageId) { this.waMessageId = waMessageId; }

    public NotificationStatus getStatus() { return status; }
    public void setStatus(NotificationStatus status) { this.status = status; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public OffsetDateTime getNextAttemptAt() { return nextAttemptAt; }
    public void setNextAttemptAt(OffsetDateTime nextAttemptAt) { this.nextAttemptAt = nextAttemptAt; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public OffsetDateTime getCreatedAt() { return createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
