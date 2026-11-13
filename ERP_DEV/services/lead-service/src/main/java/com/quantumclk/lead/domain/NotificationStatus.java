package com.quantumclk.lead.domain;

/** Statuses only move to a higher rank, so duplicate or out-of-order webhooks change nothing. */
public enum NotificationStatus {
    PENDING(0),
    ACCEPTED(1),
    SENT(2),
    FAILED(3),
    DELIVERED(3),
    READ(4);

    private final int rank;

    NotificationStatus(int rank) {
        this.rank = rank;
    }

    public int rank() {
        return rank;
    }
}
