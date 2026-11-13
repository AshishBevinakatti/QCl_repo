package com.quantumclk.lead.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "lead")
public class Lead {

    @Id
    private UUID id;

    @Column(name = "public_reference", nullable = false, unique = true, length = 50)
    private String publicReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portal_guest_id")
    private PortalGuest portalGuest;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(name = "checkin_date", nullable = false)
    private LocalDate checkinDate;

    @Column(name = "checkout_date", nullable = false)
    private LocalDate checkoutDate;

    @Column(name = "room_category", nullable = false, length = 100)
    private String roomCategory;

    @Column(name = "guest_count", nullable = false)
    private int guestCount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeadStatus status;

    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM";

    @Column(name = "assigned_to", length = 100)
    private String assignedTo;

    @Column(name = "claimed_by", length = 100)
    private String claimedBy;

    @Column(name = "claimed_at")
    private OffsetDateTime claimedAt;

    @Column(name = "sla_deadline", nullable = false)
    private OffsetDateTime slaDeadline;

    @Column(name = "sla_breached", nullable = false)
    private boolean slaBreached = false;

    @Column(name = "voice_escalation_triggered", nullable = false)
    private boolean voiceEscalationTriggered = false;

    @Column(name = "erp_guest_id")
    private UUID erpGuestId;

    @Column(name = "erp_reservation_id")
    private UUID erpReservationId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Lead() {
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPublicReference() { return publicReference; }
    public void setPublicReference(String publicReference) { this.publicReference = publicReference; }

    public PortalGuest getPortalGuest() { return portalGuest; }
    public void setPortalGuest(PortalGuest portalGuest) { this.portalGuest = portalGuest; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getCheckinDate() { return checkinDate; }
    public void setCheckinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; }

    public LocalDate getCheckoutDate() { return checkoutDate; }
    public void setCheckoutDate(LocalDate checkoutDate) { this.checkoutDate = checkoutDate; }

    public String getRoomCategory() { return roomCategory; }
    public void setRoomCategory(String roomCategory) { this.roomCategory = roomCategory; }

    public int getGuestCount() { return guestCount; }
    public void setGuestCount(int guestCount) { this.guestCount = guestCount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LeadStatus getStatus() { return status; }
    public void setStatus(LeadStatus status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public String getClaimedBy() { return claimedBy; }
    public void setClaimedBy(String claimedBy) { this.claimedBy = claimedBy; }

    public OffsetDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(OffsetDateTime claimedAt) { this.claimedAt = claimedAt; }

    public OffsetDateTime getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(OffsetDateTime slaDeadline) { this.slaDeadline = slaDeadline; }

    public boolean isSlaBreached() { return slaBreached; }
    public void setSlaBreached(boolean slaBreached) { this.slaBreached = slaBreached; }

    public boolean isVoiceEscalationTriggered() { return voiceEscalationTriggered; }
    public void setVoiceEscalationTriggered(boolean voiceEscalationTriggered) { this.voiceEscalationTriggered = voiceEscalationTriggered; }

    public UUID getErpGuestId() { return erpGuestId; }
    public void setErpGuestId(UUID erpGuestId) { this.erpGuestId = erpGuestId; }

    public UUID getErpReservationId() { return erpReservationId; }
    public void setErpReservationId(UUID erpReservationId) { this.erpReservationId = erpReservationId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
