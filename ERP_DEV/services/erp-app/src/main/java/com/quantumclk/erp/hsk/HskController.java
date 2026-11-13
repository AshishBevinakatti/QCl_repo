package com.quantumclk.erp.hsk;

import com.quantumclk.erp.erp02.RoomCategoryController;
import com.quantumclk.erp.erp02.RoomRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SOW §19: housekeeping board + task transitions. Transitions need
 * housekeeping/manager/superadmin (reception reads room status only —
 * enforced here and proven by test).
 */
@RestController
@RequestMapping("/api/v1/housekeeping")
public class HskController {

  private final HousekeepingService service;
  private final HousekeepingTaskRepository tasks;
  private final RoomRepository rooms;

  public HskController(
      HousekeepingService service, HousekeepingTaskRepository tasks, RoomRepository rooms) {
    this.service = service;
    this.tasks = tasks;
    this.rooms = rooms;
  }

  /** Board: every room with status + its open tasks (one call for the wall display). */
  @PreAuthorize("@perm.hasAny('housekeeping:tasks', 'frontdesk:view')")
  @GetMapping("/board")
  public List<RoomBoard> board() {
    UUID property = RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
    return rooms.findByPropertyId(property).stream()
        .map(
            room ->
                new RoomBoard(
                    room.getId(), room.getRoomNo(), room.getStatus(),
                    tasks.findByRoomIdAndStatus(room.getId(), HousekeepingTask.TODO).size()
                        + tasks.findByRoomIdAndStatus(room.getId(), HousekeepingTask.DOING).size()
                        + tasks.findByRoomIdAndStatus(room.getId(), HousekeepingTask.INSPECT).size()))
        .toList();
  }

  @PreAuthorize("@perm.has('housekeeping:tasks')")
  @PostMapping("/tasks")
  public TaskDto create(@RequestBody CreateTask body, HttpServletRequest req) {
    return toDto(
        service.create(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.roomId(), body.assignee(),
            body.notes(), actor(req), req.getRemoteAddr()));
  }

  @PreAuthorize("@perm.has('housekeeping:tasks')")
  @PatchMapping("/tasks/{id}/advance")
  public TaskDto advance(@PathVariable UUID id, HttpServletRequest req) {
    return toDto(
        service.advance(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id, actor(req), req.getRemoteAddr()));
  }

  String actor(HttpServletRequest req) {
    return req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "unknown";
  }

  TaskDto toDto(HousekeepingTask task) {
    return new TaskDto(task.getId(), task.getRoomId(), task.getAssignee(), task.getStatus());
  }

  public record RoomBoard(UUID roomId, String roomNo, String status, long openTasks) {}

  public record CreateTask(UUID roomId, String assignee, String notes) {}

  public record TaskDto(UUID id, UUID roomId, String assignee, String status) {}
}
