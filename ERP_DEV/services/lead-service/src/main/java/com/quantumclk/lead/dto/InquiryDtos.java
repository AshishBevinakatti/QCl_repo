package com.quantumclk.lead.dto;

import com.quantumclk.lead.domain.LeadStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class InquiryDtos {

    public record CreateInquiryRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Phone is required")
        String phone,

        @NotNull(message = "Check-in date is required")
        LocalDate checkinDate,

        @NotNull(message = "Check-out date is required")
        LocalDate checkoutDate,

        @NotBlank(message = "Room category is required")
        String roomCategory,

        @Min(value = 1, message = "At least 1 guest required")
        int guestCount,

        String notes
    ) {}

    public record InquiryResponse(
        UUID id,
        String publicReference,
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
        String claimedBy,
        OffsetDateTime claimedAt,
        OffsetDateTime slaDeadline,
        boolean slaBreached,
        OffsetDateTime createdAt
    ) {}
}
