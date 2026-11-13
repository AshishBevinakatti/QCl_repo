package com.quantumclk.erp.erp02;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * SOW ERP-02 (REQ-ERP02-001…010): availability + reservation lifecycle.
 * Idempotency-Key header SHOULD accompany POST /reservations (replays return
 * the original with `X-Idempotent-Replayed: true` instead of double-booking).
 */
@RestController
@RequestMapping("/api/v1")
public class ReservationController {

  private final BookingService bookings;
  private final ReservationRepository reservations;

  public ReservationController(BookingService bookings, ReservationRepository reservations) {
    this.bookings = bookings;
    this.reservations = reservations;
  }

  @PreAuthorize("@perm.has('bookings:view')")
  @GetMapping("/availability")
  public AvailabilityDto availability(
      @RequestParam UUID categoryId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    bookings.validateDates(from, to);
    BookingService.Availability availability =
        bookings.availability(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, categoryId, from, to);
    return new AvailabilityDto(
        categoryId, from, to, availability.totalRooms(), availability.booked(),
        availability.available());
  }

  @PreAuthorize("@perm.has('bookings:create')")
  @PostMapping("/reservations")
  @ResponseStatus(HttpStatus.CREATED)
  public org.springframework.http.ResponseEntity<ReservationDto> book(
      @Valid @RequestBody CreateBody body,
      @RequestHeader(value = "Idempotency-Key", required = false) String headerKey,
      HttpServletRequest req) {
    String key = headerKey != null && !headerKey.isBlank() ? headerKey : body.idempotencyKey();
    boolean replay =
        key != null
            && !key.isBlank()
            && reservations
                .findByPropertyIdAndIdempotencyKey(
                    RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, key)
                .isPresent();
    Reservation reservation =
        bookings.book(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID,
            body.guestId(),
            body.newGuest() == null
                ? null
                : new BookingService.NewGuest(body.newGuest().name(), body.newGuest().phone()),
            body.categoryId(),
            body.checkinDate(),
            body.checkoutDate(),
            body.promoCode(),
            key,
            body.source(),
            actor(req),
            req.getRemoteAddr());
    var response = org.springframework.http.ResponseEntity.status(
        replay ? HttpStatus.OK : HttpStatus.CREATED);
    if (replay) {
      response.header("X-Idempotent-Replayed", "true");
    }
    return response.body(toDto(reservation));
  }

  @PreAuthorize("@perm.has('bookings:view')")
  @GetMapping("/reservations/{id}")
  public ReservationDto get(@PathVariable UUID id) {
    return toDto(
        bookings.orOwned(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id));
  }

  /** Reception dashboard feed: reservations overlapping a date, optional status. */
  @PreAuthorize("@perm.has('bookings:view')")
  @GetMapping("/reservations")
  public ReservationPage dashboard(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @RequestParam(required = false) String status,
      @PageableDefault(size = 20) Pageable pageable) {
    Page<Reservation> page =
        reservations.dashboard(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, date, status, pageable);
    return new ReservationPage(
        page.getContent().stream().map(this::toDto).toList(), page.getNumber(),
        page.getTotalElements());
  }

  /**
   * 3.8 short-ref search: the ref shown on every screen is the id's first 8
   * chars, so users type or paste that (ellipsis and case tolerated).
   */
  @PreAuthorize("@perm.has('bookings:view')")
  @GetMapping("/reservations/search")
  public ReservationPage searchByRef(
      @RequestParam String ref, @PageableDefault(size = 5) Pageable pageable) {
    String prefix =
        ref == null
            ? ""
            : ref.trim().toLowerCase(java.util.Locale.ROOT).replaceAll("[^0-9a-f-]", "");
    if (prefix.isEmpty() || prefix.length() > 36) {
      return new ReservationPage(List.of(), 0, 0);
    }
    Page<Reservation> page =
        reservations.searchByRefPrefix(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, prefix + "%", pageable);
    return new ReservationPage(
        page.getContent().stream().map(this::toDto).toList(), page.getNumber(),
        page.getTotalElements());
  }

  @PreAuthorize("@perm.has('bookings:edit')")
  @PatchMapping("/reservations/{id}")
  public ReservationDto modify(
      @PathVariable UUID id, @RequestBody ModifyBody body, HttpServletRequest req) {
    return toDto(
        bookings.modify(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id, body.checkinDate(),
            body.checkoutDate(), actor(req), req.getRemoteAddr()));
  }

  @PreAuthorize("@perm.has('bookings:edit')")
  @PostMapping("/reservations/{id}/confirm")
  public ReservationDto confirm(
      @PathVariable UUID id, @RequestBody(required = false) OverrideBody body,
      HttpServletRequest req) {
    boolean requested = body != null && body.managerOverride();
    boolean manager =
        org.springframework.security.core.context.SecurityContextHolder.getContext()
            .getAuthentication().getAuthorities().stream()
            .anyMatch(a -> "MANAGER".equals(a.getAuthority()) || "SUPERADMIN".equals(a.getAuthority()));
    return toDto(
        bookings.confirm(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id, requested && manager,
            actor(req), req.getRemoteAddr()));
  }

  @PreAuthorize("@perm.has('bookings:edit')")
  @PostMapping("/reservations/{id}/cancel")
  public ReservationDto cancel(
      @PathVariable UUID id, @RequestBody(required = false) CancelBody body,
      HttpServletRequest req) {
    return toDto(
        bookings.cancel(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id,
            body == null ? null : body.reason(), actor(req), req.getRemoteAddr()));
  }

  String actor(HttpServletRequest req) {
    return req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "unknown";
  }

  ReservationDto toDto(Reservation r) {
    return new ReservationDto(
        r.getId(), r.getGuestId(), r.getCategoryId(), r.getCheckinDate(), r.getCheckoutDate(),
        r.getNights(), r.getQuotedTotalPaise(), r.getAdvanceDuePaise(),
        r.getCancellationFeePaise(), r.getStatus(), r.getSource());
  }

  public record AvailabilityDto(
      UUID categoryId, LocalDate from, LocalDate to, long totalRooms, long booked, long available) {}

  public record CreateBody(
      UUID guestId,
      NewGuestBody newGuest,
      @NotNull UUID categoryId,
      @NotNull LocalDate checkinDate,
      @NotNull LocalDate checkoutDate,
      String promoCode,
      String idempotencyKey,
      String source) {}

  public record NewGuestBody(String name, String phone) {}

  public record ModifyBody(LocalDate checkinDate, LocalDate checkoutDate) {}

  public record OverrideBody(boolean managerOverride) {}

  public record CancelBody(String reason) {}

  public record ReservationDto(
      UUID id, UUID guestId, UUID categoryId, LocalDate checkinDate, LocalDate checkoutDate,
      int nights, long quotedTotalPaise, long advanceDuePaise, long cancellationFeePaise,
      String status, String source) {}

  public record ReservationPage(List<ReservationDto> items, int page, long total) {}
}
