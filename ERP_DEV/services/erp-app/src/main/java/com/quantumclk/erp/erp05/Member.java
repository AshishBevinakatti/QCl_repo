package com.quantumclk.erp.erp05;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.UUID;

/**
 * SOW ERP-05: member. One member per guest (unique); points live in the
 * ledger, never here. Status expires by job, renews by renewal.
 */
@Entity
@Table(
    name = "member",
    uniqueConstraints = {
      @UniqueConstraint(columnNames = "guest_id"),
      @UniqueConstraint(columnNames = {"property_id", "membership_no"})
    })
public class Member {

  public static final String ACTIVE = "active";
  public static final String EXPIRED = "expired";

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "guest_id", nullable = false)
  private UUID guestId;

  @Column(name = "membership_no", nullable = false, length = 50)
  private String membershipNo;

  @Column(nullable = false, length = 50)
  private String tier = "Silver";

  @Column(nullable = false, length = 50)
  private String status = ACTIVE;

  @Column(name = "valid_from", nullable = false)
  private LocalDate validFrom;

  @Column(name = "valid_to", nullable = false)
  private LocalDate validTo;

  protected Member() {}

  public Member(UUID propertyId, UUID guestId, String membershipNo, LocalDate validFrom,
      LocalDate validTo) {
    this.propertyId = propertyId;
    this.guestId = guestId;
    this.membershipNo = membershipNo;
    this.validFrom = validFrom;
    this.validTo = validTo;
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getGuestId() {
    return guestId;
  }

  public String getMembershipNo() {
    return membershipNo;
  }

  public String getTier() {
    return tier;
  }

  public void setTier(String tier) {
    this.tier = tier;
  }

  public String getStatus() {
    return status;
  }

  public LocalDate getValidTo() {
    return validTo;
  }

  public void expire() {
    this.status = EXPIRED;
  }

  public void renew(LocalDate validTo) {
    this.status = ACTIVE;
    this.validTo = validTo;
  }
}
