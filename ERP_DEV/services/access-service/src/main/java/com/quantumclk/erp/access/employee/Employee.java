package com.quantumclk.erp.access.employee;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

/** ERP-side employee profile (AUTHENTICATION.md §9). Authorization never reads jobRole; it reads the token. */
@Entity
@Table(name = "employee")
public class Employee {
    @Id private UUID id;
    @Column(name = "keycloak_user_id") private UUID keycloakUserId;
    @Column(name = "first_name") private String firstName;
    @Column(name = "last_name") private String lastName;
    private String email;
    private String username;
    @Column(name = "mobile_e164") private String mobileE164;
    @Column(name = "job_role") private String jobRole;
    @Column(name = "whatsapp_opt_in") private boolean whatsappOptIn;
    private String status;
    @Column(name = "status_reason") private String statusReason;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "updated_by") private UUID updatedBy;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "updated_at") private Instant updatedAt;
    @Version private int version;

    protected Employee() { }

    public UUID getId() { return id; }
    public UUID getKeycloakUserId() { return keycloakUserId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getUsername() { return username; }
    public String getJobRole() { return jobRole; }
    public String getStatus() { return status; }
}
