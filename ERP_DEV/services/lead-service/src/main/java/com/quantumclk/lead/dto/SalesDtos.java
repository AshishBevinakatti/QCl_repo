package com.quantumclk.lead.dto;

import com.quantumclk.lead.domain.LeadStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class SalesDtos {

    public record ClaimLeadRequest() {}

    public record AddActivityRequest(
        @NotBlank(message = "Activity type is required (e.g. CALL, WHATSAPP, NOTE)")
        String activityType,

        @NotBlank(message = "Description / notes required")
        String description
    ) {}

    public record UpdateLeadStatusRequest(
        @NotNull(message = "New status is required")
        LeadStatus status,

        String reason
    ) {}

    public record ConvertLeadRequest(
        UUID erpGuestId,
        UUID erpReservationId
    ) {}

    public record ActivityDto(
        UUID id,
        String actor,
        String activityType,
        String description,
        OffsetDateTime createdAt
    ) {}

    public record LeadDetailDto(
        UUID id,
        String publicReference,
        UUID portalGuestId,
        String name,
        String email,
        String phone,
        LocalDate checkinDate,
        LocalDate checkoutDate,
        String roomCategory,
        int guestCount,
        String notes,
        LeadStatus status,
        String priority,
        String assignedTo,
        String claimedBy,
        OffsetDateTime claimedAt,
        OffsetDateTime slaDeadline,
        boolean slaBreached,
        boolean voiceEscalationTriggered,
        UUID erpGuestId,
        UUID erpReservationId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<ActivityDto> activities
    ) {}

    public record SalesDashboardSummary(
        long newLeadsCount,
        long inProgressCount,
        long convertedCount,
        long lostCount,
        long breachedCount
    ) {}
}
