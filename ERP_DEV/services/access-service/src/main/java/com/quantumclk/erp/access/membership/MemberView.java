package com.quantumclk.erp.access.membership;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** What the staff ERP sees of a Gold Membership registration (api.md "Memberships"). */
public record MemberView(UUID id, String membershipId, String firstName, String lastName, LocalDate dob, String mobile,
                         String email, String address, String tier, String status, EnrolledBy enrolledBy,
                         String decidedBy, OffsetDateTime decidedAt, OffsetDateTime validFrom, OffsetDateTime validUntil,
                         String accountStatus, OffsetDateTime createdAt, Payment payment) {

    public record EnrolledBy(UUID employeeId, String name, String username) { }

    /** amount is a string with two decimals ("25000.00"): money never travels as a float (rules §1). */
    public record Payment(String type, String amount, String currency, String transactionId, Proof proof, String status,
                          String rejectionReason, String verifiedBy, OffsetDateTime decidedAt) { }

    public record Proof(String fileName, String contentType, long sizeBytes, String sha256) { }

    public record PageView(List<MemberView> items, int page, int size, long total, Long pendingCount) { }

    public record NextNumber(String membershipId, boolean provisional) { }
}
