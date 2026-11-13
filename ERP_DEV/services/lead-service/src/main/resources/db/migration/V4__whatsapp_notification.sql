-- V4__whatsapp_notification.sql: outbox + delivery tracking for WhatsApp lead alerts.
-- Full phone numbers are never stored; they are read from Keycloak at send time.

CREATE TABLE IF NOT EXISTS whatsapp_notification (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
    recipient_username VARCHAR(100) NOT NULL,
    recipient_phone_masked VARCHAR(30) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    wa_message_id VARCHAR(128) UNIQUE,
    status VARCHAR(20) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL,
    error_code VARCHAR(50),
    error_message VARCHAR(300),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_whatsapp_notification_lead_recipient UNIQUE (lead_id, recipient_username, template_name)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notification_due ON whatsapp_notification(status, next_attempt_at);
