package com.quantumclk.erp.erp04;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/**
 * SOW ERP-04 (guest CRM): one profile per phone (DB unique index in V3).
 * Duplicates are merged, never hard-deleted — history must survive.
 */
@Entity
@Table(
    name = "guest",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "phone"}))
public class Guest {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, length = 30)
  private String phone;

  @Column(length = 320)
  private String email;

  @Column(name = "id_type", length = 50)
  private String idType;

  @Column(columnDefinition = "TEXT")
  private String preferences = "{}";

  @Column(nullable = false, length = 50)
  private String status = "active";

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "merged_into")
  private Guest mergedInto;

  protected Guest() {}

  public Guest(UUID propertyId, String name, String phone, String idType, String preferences) {
    this.propertyId = propertyId;
    this.name = name;
    this.phone = phone;
    this.idType = idType;
    this.preferences = preferences != null ? preferences : "{}";
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getIdType() {
    return idType;
  }

  public void setIdType(String idType) {
    this.idType = idType;
  }

  public String getPreferences() {
    return preferences;
  }

  public void setPreferences(String preferences) {
    this.preferences = preferences;
  }

  public String getStatus() {
    return status;
  }

  public Guest getMergedInto() {
    return mergedInto;
  }

  /** Merge this duplicate into the primary profile (reason is audited by the caller). */
  public void mergeInto(Guest primary) {
    this.status = "merged";
    this.mergedInto = primary;
  }
}
