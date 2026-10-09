package com.quantumclk.erp.erp03;

import com.quantumclk.erp.erp02.Reservation;
import com.quantumclk.erp.erp02.ReservationRepository;
import com.quantumclk.erp.erp02.Room;
import com.quantumclk.erp.erp02.RoomCategory;
import com.quantumclk.erp.erp02.RoomCategoryController;
import com.quantumclk.erp.erp02.RoomCategoryRepository;
import com.quantumclk.erp.erp02.RoomRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * SOW ERP-03 (REQ-ERP03-001…007): reception dashboard, check-in/out,
 * transfer, walk-ins, arrivals/departures, occupancy. Settlement gates
 * enforce against the folio stub (3.4 fills real balances, no API change).
 */
@RestController
@RequestMapping("/api/v1")
public class StayController {

  private final StayService stays;
  private final ReservationRepository reservations;
  private final RoomRepository rooms;
  private final RoomCategoryRepository categories;
  private final StayRepository stayRepository;

  public StayController(
      StayService stays,
      ReservationRepository reservations,
      RoomRepository rooms,
      RoomCategoryRepository categories,
      StayRepository stayRepository) {
    this.stays = stays;
    this.reservations = reservations;
    this.rooms = rooms;
    this.categories = categories;
    this.stayRepository = stayRepository;
  }

  @PostMapping("/stays/check-in")
  public StayDto checkIn(@RequestBody CheckInBody body, HttpServletRequest req) {
    return toDto(
        stays.checkIn(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.reservationId(), body.roomId(),
            actor(req), req.getRemoteAddr()));
  }

  @PostMapping("/stays/{id}/check-out")
  public StayDto checkOut(
      @PathVariable UUID id,
      @RequestBody(required = false) OverrideBody body,
      HttpServletRequest req) {
    return toDto(
        stays.checkOut(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id,
            body != null && body.managerOverride(), actor(req), req.getRemoteAddr()));
  }

  @PostMapping("/stays/{id}/transfer")
  public StayDto transfer(
      @PathVariable UUID id, @RequestBody TransferBody body, HttpServletRequest req) {
    return toDto(
        stays.transfer(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id, body.toRoomId(), body.reason(),
            actor(req), req.getRemoteAddr()));
  }

  @PostMapping("/walk-ins")
  public StayDto walkIn(@RequestBody WalkInBody body, HttpServletRequest req) {
    return toDto(
        stays.walkIn(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.name(), body.phone(),
            body.categoryId(), body.roomId(), actor(req), req.getRemoteAddr()));
  }

  /** Reception dashboard: arrivals, departures, in-house, room grid, occupancy. */
  @GetMapping("/front-office/dashboard")
  public Dashboard dashboard(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    LocalDate businessDate = date != null ? date : LocalDate.now(com.quantumclk.erp.erp02.BookingService.ZONE);
    UUID property = RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
    List<Reservation> confirmed =
        reservations.dashboard(property, businessDate, Reservation.CONFIRMED,
            Pageable.unpaged()).getContent();
    List<Stay> inHouse = stayRepository.findCheckedIn(property);
    List<Room> allRooms = rooms.findByPropertyId(property);
    Map<String, String> roomNames =
        allRooms.stream().collect(Collectors.toMap(r -> r.getId().toString(), Room::getRoomNo));
    return new Dashboard(
        businessDate,
        confirmed.stream().map(r -> r.getId().toString()).toList(),
        inHouse.stream().map(s -> s.getId().toString()).toList(),
        allRooms.stream().map(r -> new RoomDto(r.getId(), r.getRoomNo(), r.getStatus())).toList(),
        occupancy(allRooms),
        roomNames);
  }

  List<OccupancyDto> occupancy(List<Room> allRooms) {
    Map<UUID, String> names =
        categories.findAll().stream()
            .collect(Collectors.toMap(RoomCategory::getId, RoomCategory::getName));
    return allRooms.stream()
        .collect(Collectors.groupingBy(Room::getCategoryId))
        .entrySet().stream()
        .map(
            e -> {
              long occupied =
                  e.getValue().stream().filter(r -> "occupied".equals(r.getStatus())).count();
              return new OccupancyDto(
                  e.getKey(), names.getOrDefault(e.getKey(), "?"), e.getValue().size(), occupied,
                  e.getValue().size() - occupied);
            })
        .toList();
  }

  @GetMapping("/arrivals")
  public List<String> arrivals(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @PageableDefault(size = 100) Pageable pageable) {
    Page<Reservation> page =
        reservations.dashboard(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, date, Reservation.CONFIRMED, pageable);
    return page.getContent().stream().map(r -> r.getId().toString()).toList();
  }

  String actor(HttpServletRequest req) {
    return req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "unknown";
  }

  StayDto toDto(Stay stay) {
    return new StayDto(stay.getId(), stay.getReservationId(), stay.getRoomId(), stay.getStatus());
  }

  public record CheckInBody(UUID reservationId, UUID roomId) {}

  public record OverrideBody(boolean managerOverride) {}

  public record TransferBody(UUID toRoomId, String reason) {}

  public record WalkInBody(String name, String phone, UUID categoryId, UUID roomId) {}

  public record StayDto(UUID id, UUID reservationId, UUID roomId, String status) {}

  public record RoomDto(UUID id, String roomNo, String status) {}

  public record OccupancyDto(UUID categoryId, String category, long total, long occupied, long free) {}

  public record Dashboard(
      LocalDate date,
      List<String> arrivals,
      List<String> inHouse,
      List<RoomDto> rooms,
      List<OccupancyDto> occupancy,
      Map<String, String> roomNames) {}
}
