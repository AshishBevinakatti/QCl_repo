package com.quantumclk.erp.erp03;

import com.quantumclk.erp.erp02.Reservation;
import com.quantumclk.erp.erp02.ReservationRepository;
import com.quantumclk.erp.erp02.Room;
import com.quantumclk.erp.erp02.RoomCategory;
import com.quantumclk.erp.erp02.RoomCategoryController;
import com.quantumclk.erp.erp02.RoomCategoryRepository;
import com.quantumclk.erp.erp02.RoomRepository;
import com.quantumclk.erp.erp04.GuestRepository;
import com.quantumclk.erp.erp07.FolioService;
import com.quantumclk.erp.erp07.Payment;
import com.quantumclk.erp.erp07.PaymentRepository;
import com.quantumclk.erp.hsk.HousekeepingTask;
import com.quantumclk.erp.hsk.HousekeepingTaskRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.Instant;
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
  private final GuestRepository guests;
  private final FolioService folios;
  private final HousekeepingTaskRepository tasks;
  private final PaymentRepository payments;

  public StayController(
      StayService stays,
      ReservationRepository reservations,
      RoomRepository rooms,
      RoomCategoryRepository categories,
      StayRepository stayRepository,
      GuestRepository guests,
      FolioService folios,
      HousekeepingTaskRepository tasks,
      PaymentRepository payments) {
    this.stays = stays;
    this.reservations = reservations;
    this.rooms = rooms;
    this.categories = categories;
    this.stayRepository = stayRepository;
    this.guests = guests;
    this.folios = folios;
    this.tasks = tasks;
    this.payments = payments;
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

  /**
   * Departures: checked-in stays whose reservation checks out on the date,
   * with the folio outstanding that drives the Ready / Pending Payment badge
   * (same definition as the check-out settlement gate).
   */
  @GetMapping("/departures")
  public List<DepartureDto> departures(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    LocalDate businessDate =
        date != null ? date : LocalDate.now(com.quantumclk.erp.erp02.BookingService.ZONE);
    return stayRepository.findCheckedIn(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID).stream()
        .flatMap(s -> reservations.findById(s.getReservationId()).stream().map(r -> toDeparture(s, r)))
        .filter(d -> businessDate.equals(d.checkoutDate()))
        .toList();
  }

  private DepartureDto toDeparture(Stay stay, Reservation reservation) {
    long outstanding = folios.outstandingForStay(stay.getId());
    return new DepartureDto(
        stay.getId(),
        reservation.getId(),
        guestName(reservation.getGuestId()),
        roomNo(stay.getRoomId()),
        reservation.getCheckinDate(),
        reservation.getCheckoutDate(),
        reservation.getNights(),
        outstanding,
        outstanding > 0 ? "Pending Payment" : "Ready");
  }

  /** In-house guests: every checked-in stay with guest, room and planned checkout. */
  @GetMapping("/in-house")
  public List<InHouseDto> inHouse() {
    return stayRepository.findCheckedIn(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID).stream()
        .map(
            s -> {
              LocalDate checkout =
                  reservations.findById(s.getReservationId()).map(Reservation::getCheckoutDate).orElse(null);
              String guest =
                  reservations.findById(s.getReservationId()).map(r -> guestName(r.getGuestId())).orElse("—");
              return new InHouseDto(s.getId(), guest, roomNo(s.getRoomId()), checkout, "In House");
            })
        .toList();
  }

  /**
   * Computed alerts (nothing stored): rooms not ready with open tasks,
   * pending payments (aged from their creation time), and overstays.
   * Guest requests / maintenance issues have no entities yet — not invented.
   */
  @GetMapping("/alerts")
  public List<AlertDto> alerts() {
    UUID property = RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
    LocalDate today = LocalDate.now(com.quantumclk.erp.erp02.BookingService.ZONE);
    List<AlertDto> out = new java.util.ArrayList<>();
    for (String state : List.of(HousekeepingTask.TODO, HousekeepingTask.DOING, HousekeepingTask.INSPECT)) {
      for (HousekeepingTask task : tasks.findByPropertyIdAndStatus(property, state)) {
        out.add(new AlertDto("medium",
            "Room " + roomNo(task.getRoomId()) + " not ready — housekeeping " + state,
            task.getId().toString()));
      }
    }
    for (Payment payment : payments.findByPropertyId(property)) {
      if (Payment.PENDING.equals(payment.getStatus())) {
        out.add(new AlertDto("high",
            "Payment verification required — " + age(payment.getCreatedAt()),
            payment.getId().toString()));
      }
    }
    for (Stay stay : stayRepository.findCheckedIn(property)) {
      reservations.findById(stay.getReservationId())
          .filter(r -> r.getCheckoutDate() != null && r.getCheckoutDate().isBefore(today))
          .ifPresent(r -> out.add(new AlertDto("high",
              "Overstay — Room " + roomNo(stay.getRoomId()) + " (due " + r.getCheckoutDate() + ")",
              stay.getId().toString())));
    }
    return out;
  }

  private String guestName(UUID guestId) {
    if (guestId == null) return "—";
    return guests.findById(guestId).map(g -> g.getName()).orElse("—");
  }

  private String roomNo(UUID roomId) {
    if (roomId == null) return "—";
    return rooms.findById(roomId).map(Room::getRoomNo).orElse("—");
  }

  private static String age(Instant createdAt) {
    if (createdAt == null) return "today";
    long minutes = Duration.between(createdAt, Instant.now()).toMinutes();
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + " mins ago";
    long hours = minutes / 60;
    if (hours < 24) return hours + (hours == 1 ? " hour ago" : " hours ago");
    return "today";
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

  public record DepartureDto(
      UUID stayId,
      UUID reservationId,
      String guestName,
      String roomNo,
      LocalDate checkinDate,
      LocalDate checkoutDate,
      int nights,
      long outstandingPaise,
      String status) {}

  public record InHouseDto(
      UUID stayId, String guestName, String roomNo, LocalDate checkoutDate, String status) {}

  public record AlertDto(String severity, String text, String ref) {}

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
