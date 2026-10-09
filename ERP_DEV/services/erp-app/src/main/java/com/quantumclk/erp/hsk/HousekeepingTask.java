package com.quantumclk.erp.hsk;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * SOW §19: cleaning task. Lifecycle todo → doing → inspect → done; reaching
 * done flips the room to ready (the signal reception waits for). Only
 * housekeeping transitions tasks; reception reads room status.
 */
@Entity
@Table(name = "housekeeping_task")
public class HousekeepingTask {

  public static final String TODO = "todo";
  public static final String DOING = "doing";
  public static final String INSPECT = "inspect";
  public static final String DONE = "done";

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "room_id", nullable = false)
  private UUID roomId;

  @Column(length = 320)
  private String assignee;

  @Column(nullable = false, length = 50)
  private String status = TODO;

  @Column(columnDefinition = "TEXT")
  private String notes;

  protected HousekeepingTask() {}

  public HousekeepingTask(UUID propertyId, UUID roomId, String assignee, String notes) {
    this.propertyId = propertyId;
    this.roomId = roomId;
    this.assignee = assignee;
    this.notes = notes;
  }

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getRoomId() {
    return roomId;
  }

  public String getAssignee() {
    return assignee;
  }

  public void setAssignee(String assignee) {
    this.assignee = assignee;
  }

  public String getStatus() {
    return status;
  }

  /** Forward-only transition (todo→doing→inspect→done); anything else is 422. */
  public void advance() {
    this.status =
        switch (status) {
          case TODO -> DOING;
          case DOING -> INSPECT;
          case INSPECT -> DONE;
          default -> throw new IllegalStateException("task already done");
        };
  }
}
