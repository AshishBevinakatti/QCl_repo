package com.quantumclk.erp.erp03;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.erp02.BookingService;
import com.quantumclk.erp.erp02.BookingService.NewGuest;
import com.quantumclk.erp.erp02.Reservation;
import com.quantumclk.erp.erp02.ReservationRepository;
import com.quantumclk.erp.erp02.Room;
import com.quantumclk.erp.erp02.RoomRepository;
import com.quantumclk.erp.hsk.HousekeepingService;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-03: check-in/out, transfer, walk-ins. Room writes serialize on the
 * room row lock (same pattern as the booking category lock); the race test
 * proves two stays can never share a room on overlapping dates.
 */
@Service
public class StayService {

  private final StayRepository stays;
  private final RoomTransferRepository transfers;
  private final ReservationRepository reservations;
  private final RoomRepository rooms;
  private final BookingService bookings;
  private final HousekeepingService housekeeping;
  private final FolioBalance folio;
  private final AuditLog auditLog;

  public StayService(
      StayRepository stays,
      RoomTransferRepository transfers,
      ReservationRepository reservations,
      RoomRepository rooms,
      BookingService bookings,
      HousekeepingService housekeeping,
      FolioBalance folio,
      AuditLog auditLog) {
    this.stays = stays;
    this.transfers = transfers;
    this.reservations = reservations;
    this.rooms = rooms;
    this.bookings = bookings;
    this.housekeeping = housekeeping;
    this.folio = folio;
    this.auditLog = auditLog;
  }

  @Transactional
  public Stay checkIn(UUID propertyId, UUID reservationId, UUID roomId, String actor, String ip) {
    Reservation reservation = ownedReservation(propertyId, reservationId);
    if (stays.findByReservationId(reservationId).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "reservation already checked in");
    }
    if (!Reservation.CONFIRMED.equals(reservation.getStatus())) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY, "only confirmed bookings can be checked in");
    }
    Room room = pickRoom(propertyId, reservation, roomId);
    reservation.checkIn(room.getId());
    reservations.save(reservation);
    room.setStatus("occupied");
    rooms.save(room);
    Stay stay = new Stay(propertyId, reservationId, room.getId());
    stays.save(stay);
    audit(propertyId, actor, "stay.checked-in", stay.getId().toString(), null,
        room.getRoomNo(), null, ip);
    return stay;
  }

  @Transactional
  public Stay checkOut(UUID propertyId, UUID stayId, boolean managerOverride, String actor,
      String ip) {
    Stay stay = ownedStay(propertyId, stayId);
    if (!Stay.CHECKED_IN.equals(stay.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "stay is not active");
    }
    Reservation reservation = ownedReservation(propertyId, stay.getReservationId());
    long outstanding = folio.outstandingFor(reservation.getId());
    if (outstanding > 0 && !managerOverride) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY, "folio has outstanding balance: " + outstanding);
    }
    stay.checkOut();
    stays.save(stay);
    reservation.checkOut();
    reservations.save(reservation);
    Room room =
        rooms.lockById(stay.getRoomId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "room not found"));
    room.setStatus("dirty");
    rooms.save(room);
    housekeeping.create(propertyId, room.getId(), null, "checkout clean", actor, ip);
    audit(propertyId, actor, "stay.checked-out", stay.getId().toString(), Stay.CHECKED_IN,
        Stay.CHECKED_OUT, managerOverride ? "manager override" : null, ip);
    return stay;
  }

  @Transactional
  public Stay transfer(UUID propertyId, UUID stayId, UUID toRoomId, String reason, String actor,
      String ip) {
    Stay stay = ownedStay(propertyId, stayId);
    if (!Stay.CHECKED_IN.equals(stay.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "stay is not active");
    }
    Reservation reservation = ownedReservation(propertyId, stay.getReservationId());
    Room from =
        rooms.lockById(stay.getRoomId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "room not found"));
    Room to = lockedRoom(propertyId, toRoomId);
    if (!to.getCategoryId().equals(reservation.getCategoryId())) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY, "target room is a different category");
    }
    guardRoomFree(to, reservation.getCheckinDate(), reservation.getCheckoutDate(), stay.getId());
    to.setStatus("occupied");
    rooms.save(to);
    from.setStatus("dirty");
    rooms.save(from);
    housekeeping.create(propertyId, from.getId(), null, "transfer clean", actor, ip);
    stay.setRoomId(to.getId());
    stays.save(stay);
    transfers.save(new RoomTransfer(stay.getId(), from.getId(), to.getId(), actor, reason));
    folio.noteTransfer(stay.getId(), from.getId(), to.getId());
    audit(propertyId, actor, "stay.transferred", stay.getId().toString(), from.getRoomNo(),
        to.getRoomNo(), reason, ip);
    return stay;
  }

  /** Walk-in: book (today→tomorrow) + confirm + check-in as one audited chain. */
  @Transactional
  public Stay walkIn(UUID propertyId, String name, String phone, UUID categoryId, UUID roomId,
      String actor, String ip) {
    LocalDate today = LocalDate.now(BookingService.ZONE);
    Reservation reservation =
        bookings.book(propertyId, null, new NewGuest(name, phone), categoryId, today,
            today.plusDays(1), null, null, "walk-in", actor, ip);
    bookings.confirm(propertyId, reservation.getId(), actor, ip);
    return checkIn(propertyId, reservation.getId(), roomId, actor, ip);
  }

  Room pickRoom(UUID propertyId, Reservation reservation, UUID roomId) {
    if (roomId != null) {
      Room room = lockedRoom(propertyId, roomId);
      if (!room.getCategoryId().equals(reservation.getCategoryId())) {
        throw new ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY, "room is a different category");
      }
      if (!"ready".equals(room.getStatus())) {
        throw new ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY, "room is not ready: " + room.getStatus());
      }
      guardRoomFree(room, reservation.getCheckinDate(), reservation.getCheckoutDate(), null);
      return room;
    }
    return rooms.findByPropertyIdAndCategoryIdAndStatus(
            propertyId, reservation.getCategoryId(), "ready").stream()
        .filter(
            room ->
                stays.countOverlapping(
                        room.getId(), reservation.getCheckinDate(), reservation.getCheckoutDate(),
                        null)
                    == 0)
        .findFirst()
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.CONFLICT, "no ready room free"));
  }

  void guardRoomFree(Room room, LocalDate from, LocalDate to, UUID excludeStayId) {
    if (stays.countOverlapping(room.getId(), from, to, excludeStayId) > 0) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "room already occupied for these dates: " + room.getRoomNo());
    }
  }

  Room lockedRoom(UUID propertyId, UUID roomId) {
    return rooms.lockById(roomId)
        .filter(r -> propertyId.equals(r.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "room not found"));
  }

  Reservation ownedReservation(UUID propertyId, UUID id) {
    return reservations
        .findById(id)
        .filter(r -> propertyId.equals(r.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "reservation not found"));
  }

  Stay ownedStay(UUID propertyId, UUID id) {
    return stays
        .findById(id)
        .filter(s -> propertyId.equals(s.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "stay not found"));
  }

  void audit(UUID propertyId, String actor, String action, String objectId, String before,
      String after, String reason, String ip) {
    auditLog.append(propertyId, actor, action, "stay", objectId, before, after, reason, ip);
  }
}
