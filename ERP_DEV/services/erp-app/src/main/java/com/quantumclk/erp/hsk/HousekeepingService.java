package com.quantumclk.erp.hsk;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.erp02.Room;
import com.quantumclk.erp.erp02.RoomRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW §19: task transitions. Reaching done flips the room to ready —
 * the single event reception's availability depends on.
 */
@Service
public class HousekeepingService {

  private final HousekeepingTaskRepository tasks;
  private final RoomRepository rooms;
  private final AuditLog auditLog;

  public HousekeepingService(
      HousekeepingTaskRepository tasks, RoomRepository rooms, AuditLog auditLog) {
    this.tasks = tasks;
    this.rooms = rooms;
    this.auditLog = auditLog;
  }

  @Transactional
  public HousekeepingTask create(UUID propertyId, UUID roomId, String assignee, String notes,
      String actor, String ip) {
    HousekeepingTask task = new HousekeepingTask(propertyId, roomId, assignee, notes);
    tasks.save(task);
    audit(propertyId, actor, "hsk.task-created", task.getId().toString(), null, notes, ip);
    return task;
  }

  @Transactional
  public HousekeepingTask advance(UUID propertyId, UUID taskId, String actor, String ip) {
    HousekeepingTask task =
        tasks.findById(taskId)
            .filter(t -> propertyId.equals(t.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "task not found"));
    String before = task.getStatus();
    try {
      task.advance();
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
    }
    if (HousekeepingTask.DONE.equals(task.getStatus())) {
      Room room =
          rooms.lockById(task.getRoomId())
              .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "room not found"));
      room.setStatus("ready");
      rooms.save(room);
    }
    tasks.save(task);
    audit(propertyId, actor, "hsk.task-advanced", task.getId().toString(), before,
        task.getStatus(), ip);
    return task;
  }

  void audit(UUID propertyId, String actor, String action, String objectId, String before,
      String after, String ip) {
    auditLog.append(propertyId, actor, action, "housekeeping_task", objectId, before, after, null,
        ip);
  }
}
