package com.quantumclk.lead.service;

import com.quantumclk.lead.domain.Lead;
import com.quantumclk.lead.domain.LeadActivity;
import com.quantumclk.lead.domain.LeadStatus;
import com.quantumclk.lead.domain.PortalGuest;
import com.quantumclk.lead.dto.InquiryDtos.*;
import com.quantumclk.lead.dto.SalesDtos.*;
import com.quantumclk.lead.notification.WhatsAppNotificationService;
import com.quantumclk.lead.repository.LeadActivityRepository;
import com.quantumclk.lead.repository.LeadRepository;
import com.quantumclk.lead.repository.PortalGuestRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadActivityRepository activityRepository;
    private final PortalGuestRepository guestRepository;
    private final WhatsAppNotificationService whatsApp;

    @Value("${app.sla.claim-timeout-minutes:5}")
    private int slaTimeoutMinutes;

    public LeadService(
        LeadRepository leadRepository,
        LeadActivityRepository activityRepository,
        PortalGuestRepository guestRepository,
        WhatsAppNotificationService whatsApp
    ) {
        this.leadRepository = leadRepository;
        this.activityRepository = activityRepository;
        this.guestRepository = guestRepository;
        this.whatsApp = whatsApp;
    }

    @Transactional
    public InquiryResponse createInquiry(CreateInquiryRequest req, UUID portalGuestId) {
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime deadline = now.plusMinutes(slaTimeoutMinutes);
        String publicRef = "GHR-" + (100000 + ThreadLocalRandom.current().nextInt(900000));

        PortalGuest guest = null;
        if (portalGuestId != null) {
            guest = guestRepository.findById(portalGuestId).orElse(null);
        }

        Lead lead = new Lead();
        lead.setId(id);
        lead.setPublicReference(publicRef);
        lead.setPortalGuest(guest);
        lead.setName(req.name().trim());
        lead.setEmail(req.email().trim().toLowerCase());
        lead.setPhone(req.phone().trim());
        lead.setCheckinDate(req.checkinDate());
        lead.setCheckoutDate(req.checkoutDate());
        lead.setRoomCategory(req.roomCategory().trim());
        lead.setGuestCount(req.guestCount());
        lead.setNotes(req.notes());
        lead.setStatus(LeadStatus.NEW);
        lead.setPriority("MEDIUM");
        lead.setSlaDeadline(deadline);
        lead.setSlaBreached(false);
        lead.setVoiceEscalationTriggered(false);
        lead.setCreatedAt(now);
        lead.setUpdatedAt(now);

        leadRepository.save(lead);

        // Record creation activity
        LeadActivity act = new LeadActivity(
            UUID.randomUUID(),
            lead,
            guest != null ? guest.getName() : "Guest (Online)",
            "INQUIRY_SUBMITTED",
            "Inquiry submitted online for " + req.roomCategory() + " (" + req.checkinDate() + " to " + req.checkoutDate() + ")",
            now
        );
        activityRepository.save(act);

        // Queued in this transaction; WhatsAppNotificationService sends it after commit.
        whatsApp.queueNewLeadAlerts(lead);

        return toInquiryResponse(lead);
    }

    @Transactional
    public LeadDetailDto claimLead(UUID leadId, String actor) {
        Lead lead = leadRepository.findById(leadId)
            .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        if (lead.getStatus() != LeadStatus.NEW) {
            throw new IllegalStateException("Lead is already in state: " + lead.getStatus() +
                (lead.getClaimedBy() != null ? " by " + lead.getClaimedBy() : ""));
        }

        OffsetDateTime now = OffsetDateTime.now();
        lead.setStatus(LeadStatus.IN_PROGRESS);
        lead.setClaimedBy(actor);
        lead.setClaimedAt(now);
        lead.setAssignedTo(actor);
        lead.setUpdatedAt(now);

        leadRepository.save(lead);

        LeadActivity act = new LeadActivity(
            UUID.randomUUID(),
            lead,
            actor,
            "CLAIMED",
            "Lead claimed by Sales Executive: " + actor + " (5-minute SLA disarmed)",
            now
        );
        activityRepository.save(act);

        return getLeadDetail(leadId);
    }

    @Transactional
    public LeadDetailDto addActivity(UUID leadId, String actor, AddActivityRequest req) {
        Lead lead = leadRepository.findById(leadId)
            .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        OffsetDateTime now = OffsetDateTime.now();
        lead.setUpdatedAt(now);
        leadRepository.save(lead);

        LeadActivity act = new LeadActivity(
            UUID.randomUUID(),
            lead,
            actor,
            req.activityType(),
            req.description(),
            now
        );
        activityRepository.save(act);

        return getLeadDetail(leadId);
    }

    @Transactional
    public LeadDetailDto updateStatus(UUID leadId, String actor, UpdateLeadStatusRequest req) {
        Lead lead = leadRepository.findById(leadId)
            .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        OffsetDateTime now = OffsetDateTime.now();
        LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(req.status());
        lead.setUpdatedAt(now);
        leadRepository.save(lead);

        String note = "Status updated from " + oldStatus + " to " + req.status();
        if (req.reason() != null && !req.reason().isBlank()) {
            note += " | Reason: " + req.reason();
        }

        LeadActivity act = new LeadActivity(
            UUID.randomUUID(),
            lead,
            actor,
            "STATUS_CHANGE",
            note,
            now
        );
        activityRepository.save(act);

        return getLeadDetail(leadId);
    }

    @Transactional
    public LeadDetailDto convertLead(UUID leadId, String actor, ConvertLeadRequest req) {
        Lead lead = leadRepository.findById(leadId)
            .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        OffsetDateTime now = OffsetDateTime.now();
        lead.setStatus(LeadStatus.CONVERTED);
        lead.setErpGuestId(req.erpGuestId());
        lead.setErpReservationId(req.erpReservationId());
        lead.setUpdatedAt(now);
        leadRepository.save(lead);

        LeadActivity act = new LeadActivity(
            UUID.randomUUID(),
            lead,
            actor,
            "CONVERTED",
            "Lead successfully converted to ERP Guest ID: " + req.erpGuestId() +
                (req.erpReservationId() != null ? " and Reservation ID: " + req.erpReservationId() : ""),
            now
        );
        activityRepository.save(act);

        return getLeadDetail(leadId);
    }

    @Transactional(readOnly = true)
    public List<LeadDetailDto> listAllLeads() {
        return leadRepository.findAll().stream()
            .map(this::toLeadDetail)
            .toList();
    }

    @Transactional(readOnly = true)
    public Page<LeadDetailDto> listLeadsPaged(Pageable pageable) {
        return leadRepository.findAll(pageable).map(this::toLeadDetail);
    }

    @Transactional(readOnly = true)
    public List<InquiryResponse> listGuestInquiries(UUID portalGuestId) {
        return leadRepository.findByPortalGuestIdOrderByCreatedAtDesc(portalGuestId).stream()
            .map(this::toInquiryResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public LeadDetailDto getLeadDetail(UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
            .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));
        return toLeadDetail(lead);
    }

    @Transactional(readOnly = true)
    public SalesDashboardSummary getDashboardSummary() {
        long newCount = leadRepository.countByStatus(LeadStatus.NEW);
        long inProgCount = leadRepository.countByStatus(LeadStatus.IN_PROGRESS);
        long convertedCount = leadRepository.countByStatus(LeadStatus.CONVERTED);
        long lostCount = leadRepository.countByStatus(LeadStatus.LOST);
        long breachedCount = leadRepository.findAll().stream().filter(Lead::isSlaBreached).count();

        return new SalesDashboardSummary(newCount, inProgCount, convertedCount, lostCount, breachedCount);
    }

    private InquiryResponse toInquiryResponse(Lead lead) {
        return new InquiryResponse(
            lead.getId(),
            lead.getPublicReference(),
            lead.getName(),
            lead.getEmail(),
            lead.getPhone(),
            lead.getCheckinDate(),
            lead.getCheckoutDate(),
            lead.getRoomCategory(),
            lead.getGuestCount(),
            lead.getNotes(),
            lead.getStatus(),
            lead.getPriority(),
            lead.getClaimedBy(),
            lead.getClaimedAt(),
            lead.getSlaDeadline(),
            lead.isSlaBreached(),
            lead.getCreatedAt()
        );
    }

    private LeadDetailDto toLeadDetail(Lead lead) {
        List<ActivityDto> acts = activityRepository.findByLeadIdOrderByCreatedAtDesc(lead.getId()).stream()
            .map(a -> new ActivityDto(a.getId(), a.getActor(), a.getActivityType(), a.getDescription(), a.getCreatedAt()))
            .toList();

        return new LeadDetailDto(
            lead.getId(),
            lead.getPublicReference(),
            lead.getPortalGuest() != null ? lead.getPortalGuest().getId() : null,
            lead.getName(),
            lead.getEmail(),
            lead.getPhone(),
            lead.getCheckinDate(),
            lead.getCheckoutDate(),
            lead.getRoomCategory(),
            lead.getGuestCount(),
            lead.getNotes(),
            lead.getStatus(),
            lead.getPriority(),
            lead.getAssignedTo(),
            lead.getClaimedBy(),
            lead.getClaimedAt(),
            lead.getSlaDeadline(),
            lead.isSlaBreached(),
            lead.isVoiceEscalationTriggered(),
            lead.getErpGuestId(),
            lead.getErpReservationId(),
            lead.getCreatedAt(),
            lead.getUpdatedAt(),
            acts
        );
    }
}
