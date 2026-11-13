package com.quantumclk.lead.notification;

/** A send failure. The message must be safe to store and log: no tokens, no phone numbers. */
public class WhatsAppSendException extends RuntimeException {

    private final boolean retryable;
    private final String code;

    public WhatsAppSendException(boolean retryable, String code, String safeMessage) {
        super(safeMessage);
        this.retryable = retryable;
        this.code = code;
    }

    public boolean retryable() {
        return retryable;
    }

    public String code() {
        return code;
    }
}
