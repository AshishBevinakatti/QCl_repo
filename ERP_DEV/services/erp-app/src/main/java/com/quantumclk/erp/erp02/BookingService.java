package com.quantumclk.erp.erp02;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.config.Configs;
import com.quantumclk.erp.erp04.Guest;
import com.quantumclk.erp.erp04.GuestRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-02: the booking core. Every inventory-changing write runs inside
 * one transaction behind the category lock (see RoomCategoryRepository) —
 * this method family, plus the race test, IS the no-double-booking guarantee.
 * Advance capture + folio posting are TODO(3.4): confirm() records what is
 * due; 3.4 enforces collection.
 */
@Service
public class BookingService {

  public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

  private final RoomCategoryRepository categories;
  private final RoomRepository rooms;
  private final ReservationRepository reservations;
  private final ReservationHoldRepository holds;
  private final GuestRepository guests;
  private final PricingService pricing;
  private final AuditLog auditLog;
  private final Configs configs;

  public BookingService(
      RoomCategoryRepository categories,
      RoomRepository rooms,
      ReservationRepository reservations,
      ReservationHoldRepository holds,
      GuestRepository guests,
      PricingService pricing,
      AuditLog auditLog,
      Configs configs) {
    this.categories = categories;
    this.rooms = rooms;
    this.reservations = reservations;
    this.holds = holds;
    this.guests = guests;
    this.pricing = pricing;
    this.auditLog = auditLog;
    this.configs = configs;
  }

  public Availability availability(UUID propertyId, UUID categoryId, LocalDate from, LocalDate to) {
    long total = rooms.countByPropertyIdAndCategoryId(propertyId, categoryId);
    long booked = reservations.countOverlapping(propertyId, categoryId, from, to);
    return new Availability(total, booked, Math.max(0, total - booked));
  }

  @Transactional
  public Reservation book(
      UUID propertyId,
      UUID guestId,
      NewGuest newGuest,
      UUID categoryId,
      LocalDate from,
      LocalDate to,
      String promoCode,
      String idempotencyKey,
      String source,
      String actor,
      String ip) {
    validateDates(from, to);
    String key = idempotencyKey == null || idempotencyKey.isBlank() ? UUID.randomUUID().toString() : idempotencyKey;
    Optional<Reservation> replay = reservations.findByPropertyIdAndIdempotencyKey(propertyId, key);
    if (replay.isPresent()) {
      audit(propertyId, actor, "booking.replayed", replay.get().getId().toString(), null, null, null, ip);
      return replay.get();
    }
    Guest guest = resolveGuest(propertyId, guestId, newGuest);
    // Serialize writers per category: the lock that makes the race test pass.
    categories
        .lockById(categoryId)
        .filter(c -> propertyId.equals(c.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
    Availability availability = availability(propertyId, categoryId, from, to);
    if (availability.available() <= 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "no rooms available for these dates");
    }
    LocalDate today = LocalDate.now(ZONE);
    pricing.consumePromo(propertyId, promoCode, today);
    PricingService.Quote quote = pricing.quote(propertyId, categoryId, from, to, promoCode, today);
    int nights = (int) ChronoUnit.DAYS.between(from, to);
    Reservation reservation =
        new Reservation(
            propertyId, guest.getId(), categoryId, from, to, nights, quote.totalPaise(),
            quote.advanceDuePaise(), source == null ? "web" : source, key);
    reservations.save(reservation);
    int holdMinutes = configs.getInt("booking.hold_minutes", 15);
    holds.save(new ReservationHold(reservation.getId(), Instant.now().plusSeconds(holdMinutes * 60L)));
    audit(propertyId, actor, "booking.created", reservation.getId().toString(), null,
        "total=" + quote.totalPaise(), null, ip);
    return reservation;
  }

  @Transactional
  public Reservation confirm(UUID propertyId, UUID id, String actor, String ip) {
    Reservation reservation = orOwned(propertyId, id);
    if (!Reservation.HOLD.equals(reservation.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "only holds can be confirmed");
    }
    ReservationHold hold =
        holds.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.GONE, "hold expired"));
    if (hold.getExpiresAt().isBefore(Instant.now())) {
      expireOne(propertyId, reservation, hold, ip);
      throw new ResponseStatusException(HttpStatus.GONE, "hold expired");
    }
    reservation.confirm();
    holds.deleteByReservationId(id);
    reservations.save(reservation);
    // TODO(3.4): gate on advance PAYMENT capture here; advance_due is recorded only.
    audit(propertyId, actor, "booking.confirmed", id.toString(), Reservation.HOLD, Reservation.CONFIRMED, null, ip);
    return reservation;
  }

  @Transactional
  public Reservation modify(
      UUID propertyId, UUID id, LocalDate from, LocalDate to, String actor, String ip) {
    validateDates(from, to);
    Reservation reservation = orOwned(propertyId, id);
    if (!Reservation.HOLD.equals(reservation.getStatus())
        && !Reservation.CONFIRMED.equals(reservation.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "only active bookings can be modified");
    }
    categories.lockById(reservation.getCategoryId());
    long clash =
        reservations.countOverlapping(
            propertyId, reservation.getCategoryId(), from, to, ReservationRepository.ACTIVE,
            reservation.getId());
    long total = rooms.countByPropertyIdAndCategoryId(propertyId, reservation.getCategoryId());
    if (clash >= total) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "no rooms available for the new dates");
    }
    String before = reservation.getCheckinDate() + "->" + reservation.getCheckoutDate();
    // Re-priced at CURRENT config (price-lock breaks on modification — documented in module doc).
    PricingService.Quote quote =
        pricing.quote(propertyId, reservation.getCategoryId(), from, to, null, LocalDate.now(ZONE));
    reservation.requote(from, to, (int) ChronoUnit.DAYS.between(from, to), quote.totalPaise());
    reservations.save(reservation);
    audit(propertyId, actor, "booking.modified", id.toString(), before,
        from + "->" + to, null, ip);
    return reservation;
  }

  @Transactional
  public Reservation cancel(UUID propertyId, UUID id, String reason, String actor, String ip) {
    Reservation reservation = orOwned(propertyId, id);
    if (!Reservation.HOLD.equals(reservation.getStatus())
        && !Reservation.CONFIRMED.equals(reservation.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "only active bookings can be cancelled");
    }
    long fee = cancellationFee(reservation);
    reservation.cancel(fee);
    holds.deleteByReservationId(id);
    reservations.save(reservation);
    // TODO(3.4): post fee + refund advance_due to the folio here.
    audit(propertyId, actor, "booking.cancelled", id.toString(), null, "fee=" + fee, reason, ip);
    return reservation;
  }

  /** Sweeper net: release every expired hold still marked hold (runs on a schedule + on demand). */
  @Transactional
  public int expireHolds(Instant now, String ip) {
    int released = 0;
    for (ReservationHold hold : holds.findByExpiresAtBefore(now)) {
      Optional<Reservation> found = reservations.findById(hold.getReservationId());
      if (found.isPresent() && Reservation.HOLD.equals(found.get().getStatus())) {
        expireOne(found.get().getPropertyId(), found.get(), hold, ip);
        released++;
      } else {
        holds.deleteByReservationId(hold.getReservationId());
      }
    }
    return released;
  }

  void expireOne(UUID propertyId, Reservation reservation, ReservationHold hold, String ip) {
    reservation.expire();
    holds.deleteByReservationId(hold.getReservationId());
    reservations.save(reservation);
    audit(propertyId, "system", "hold.expired", reservation.getId().toString(), Reservation.HOLD,
        Reservation.EXPIRED, null, ip);
  }

  long cancellationFee(Reservation reservation) {
    int freeHours = configs.getInt("booking.cancellation.free_hours_before", 48);
    LocalTime checkinTime;
    try {
      checkinTime = LocalTime.parse(configs.get("checkin.time", "12:00"));
    } catch (Exception e) {
      checkinTime = LocalTime.NOON;
    }
    long hoursLeft =
        ChronoUnit.HOURS.between(
            Instant.now(), reservation.getCheckinDate().atTime(checkinTime).atZone(ZONE).toInstant());
    return hoursLeft >= freeHours ? 0 : reservation.oneNightRate();
  }

  void validateDates(LocalDate from, LocalDate to) {
    if (from == null || to == null || !to.isAfter(from)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "checkout must be after checkin");
    }
    if (from.isBefore(LocalDate.now(ZONE))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "checkin cannot be in the past");
    }
    int maxNights = configs.getInt("booking.max_nights", 30);
    if (ChronoUnit.DAYS.between(from, to) > maxNights) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "stay exceeds maximum of " + maxNights + " nights");
    }
  }

  Guest resolveGuest(UUID propertyId, UUID guestId, NewGuest newGuest) {
    if (guestId != null) {
      return guests
          .findById(guestId)
          .filter(g -> propertyId.equals(g.getPropertyId()))
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "guest not found"));
    }
    if (newGuest == null || newGuest.name() == null || newGuest.phone() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guestId or newGuest required");
    }
    return guests
        .findByPropertyIdAndPhoneAndMergedIntoIsNull(propertyId, newGuest.phone())
        .orElseGet(
            () -> guests.save(new Guest(propertyId, newGuest.name(), newGuest.phone(), null, "{}")));
  }

  Reservation orOwned(UUID propertyId, UUID id) {
    return reservations
        .findById(id)
        .filter(r -> propertyId.equals(r.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "reservation not found"));
  }

  void audit(UUID propertyId, String actor, String action, String objectId, String before,
      String after, String reason, String ip) {
    auditLog.append(propertyId, actor, action, "reservation", objectId, before, after, reason, ip);
  }

  public record Availability(long totalRooms, long booked, long available) {}

  public record NewGuest(String name, String phone) {}
}
