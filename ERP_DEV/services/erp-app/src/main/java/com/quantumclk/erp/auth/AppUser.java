package com.quantumclk.erp.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/**
 * SOW ERP-08 (admin): local user directory mirroring Keycloak subjects.
 * Roles come from the [ASSUMED] matrix (security.md, D-110); the client answer
 * swaps seed data (V2), never code.
 */
@Entity
@Table(
    name = "app_user",
    uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "email"}))
public class AppUser {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String email;

  @Column(nullable = false)
  private String role;

  @Column(nullable = false)
  private String status = "active";

  protected AppUser() {}

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public String getName() {
    return name;
  }

  public String getEmail() {
    return email;
  }

  public String getRole() {
    return role;
  }

  public String getStatus() {
    return status;
  }
}
