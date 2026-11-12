package com.quantumclk.erp.erp04;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantumclk.erp.erp02.BookingService;
import com.quantumclk.erp.erp02.Reservation;
import com.quantumclk.erp.erp02.ReservationRepository;
import com.quantumclk.erp.erp02.Room;
import com.quantumclk.erp.erp02.RoomCategory;
import com.quantumclk.erp.erp02.RoomCategoryRepository;
import com.quantumclk.erp.erp02.RoomRepository;
import com.quantumclk.erp.erp03.Stay;
import com.quantumclk.erp.erp03.StayRepository;
import com.quantumclk.erp.erp05.LoyaltyLedgerRepository;
import com.quantumclk.erp.erp05.Member;
import com.quantumclk.erp.erp05.MemberRepository;
import com.quantumclk.erp.erp07.Folio;
import com.quantumclk.erp.erp07.FolioEntry;
import com.quantumclk.erp.erp07.FolioRepository;
import com.quantumclk.erp.erp07.FolioService;
import com.quantumclk.erp.erp07.Invoice;
import com.quantumclk.erp.erp07.InvoiceRepository;
import com.quantumclk.erp.erp07.Payment;
import com.quantumclk.erp.erp07.PaymentRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SOW ERP-04 (REQ-ERP04-001…005): one bounded read projection for the Guest 360
 * workspace. It joins existing reservation, stay, billing and membership records;
 * it never writes, invents or duplicates their business rules.
 */
@Service
public class GuestProfileService {

  static final int HISTORY_LIMIT = 20;
  static final int ALERT_LIMIT = 5;
  private static final List<String> ACTIONABLE =
      List.of(Reservation.HOLD, Reservation.CONFIRMED);
  private static final List<String> PAYMENT_ALERT_STATUSES =
      List.of(Payment.PENDING, Payment.FAILED);

  private final ReservationRepository reservations;
  private final StayRepository stays;
  private final RoomRepository rooms;
  private final RoomCategoryRepository categories;
  private final MemberRepository members;
  private final LoyaltyLedgerRepository ledger;
  private final FolioRepository folios;
  private final FolioService folioService;
  private final InvoiceRepository invoices;
  private final PaymentRepository payments;
  private final ObjectMapper objectMapper;

  public GuestProfileService(
      ReservationRepository reservations,
      StayRepository stays,
      RoomRepository rooms,
      RoomCategoryRepository categories,
      MemberRepository members,
      LoyaltyLedgerRepository ledger,
      FolioRepository folios,
      FolioService folioService,
      InvoiceRepository invoices,
      PaymentRepository payments,
      ObjectMapper objectMapper) {
    this.reservations = reservations;
    this.stays = stays;
    this.rooms = rooms;
    this.categories = categories;
    this.members = members;
    this.ledger = ledger;
    this.folios = folios;
    this.folioService = folioService;
    this.invoices = invoices;
    this.payments = payments;
    this.objectMapper = objectMapper;
  }

  @Transactional(readOnly = true)
  public GuestProfileDto load(UUID propertyId, Guest guest) {
    LocalDate today = LocalDate.now(BookingService.ZONE);
    UUID guestId = guest.getId();

    Stay activeStay = firstStay(
        stays.findCheckedInByGuest(propertyId, guestId, PageRequest.of(0, 1)));
    Reservation activeReservation =
        activeStay == null ? null : ownedReservation(propertyId, activeStay.getReservationId());
    if (activeReservation == null) {
      activeStay = null;
    }

    Reservation next =
        activeStay == null
            ? firstReservation(
                reservations.findNextForGuest(
                    propertyId, guestId, ACTIONABLE, PageRequest.of(0, 1)))
            : null;

    Page<Reservation> historyPage =
        reservations.findByGuestForProfile(
            propertyId, guestId, PageRequest.of(0, HISTORY_LIMIT));
    List<Reservation> history = new ArrayList<>(historyPage.getContent());
    if (activeReservation != null
        && history.stream().noneMatch(r -> r.getId().equals(activeReservation.getId()))) {
      history.add(0, activeReservation);
    }
    if (next != null && history.stream().noneMatch(r -> r.getId().equals(next.getId()))) {
      history.add(0, next);
    }

    Map<UUID, Stay> stayByReservation = staysByReservation(history, activeStay);
    Map<UUID, Room> roomById = roomsById(history, stayByReservation);
    Map<UUID, RoomCategory> categoryById = categoriesById(history);

    UUID activeReservationId = activeReservation == null ? null : activeReservation.getId();
    List<GuestProfileDto.ReservationView> historyViews =
        history.stream()
            .map(
                r ->
                    toView(
                        r,
                        stayByReservation.get(r.getId()),
                        activeReservationId,
                        roomById,
                        categoryById))
            .toList();
    GuestProfileDto.ReservationView currentView =
        activeReservation == null
            ? null
            : toView(
                activeReservation,
                activeStay,
                activeReservation.getId(),
                roomById,
                categoryById);
    GuestProfileDto.ReservationView nextView =
        next == null
            ? null
            : toView(next, stayByReservation.get(next.getId()), null, roomById, categoryById);

    Member member = members.findByPropertyIdAndGuestId(propertyId, guestId).orElse(null);
    int points = member == null ? 0 : ledger.balance(member.getId());
    GuestProfileDto.MemberView membership =
        member == null
            ? null
            : new GuestProfileDto.MemberView(
                member.getId(),
                member.getMembershipNo(),
                member.getTier(),
                member.getStatus(),
                member.getValidFrom(),
                member.getValidTo(),
                points);

    Folio folio = selectFolio(propertyId, guestId, activeStay);
    GuestProfileDto.BillingView billing =
        billing(propertyId, folio, currentView, nextView);
    List<GuestProfileDto.AlertView> alerts =
        alerts(today, currentView, nextView, billing);

    return new GuestProfileDto(
        new GuestProfileDto.GuestView(
            guest.getId(),
            guest.getName(),
            guest.getPhone(),
            guest.getEmail(),
            guest.getIdType(),
            guest.getStatus(),
            member == null ? null : member.getId()),
        membership,
        currentView,
        nextView,
        operationalState(today, currentView, nextView, historyViews),
        historyViews,
        (int) historyPage.getTotalElements(),
        billing,
        alerts,
        preferences(guest));
  }

  private Stay firstStay(List<Stay> rows) {
    return rows.isEmpty() ? null : rows.get(0);
  }

  private Reservation firstReservation(List<Reservation> rows) {
    return rows.isEmpty() ? null : rows.get(0);
  }

  private Reservation ownedReservation(UUID propertyId, UUID reservationId) {
    return reservations
        .findById(reservationId)
        .filter(r -> propertyId.equals(r.getPropertyId()))
        .orElse(null);
  }

  private Map<UUID, Stay> staysByReservation(List<Reservation> history, Stay activeStay) {
    Collection<UUID> ids = history.stream().map(Reservation::getId).toList();
    Map<UUID, Stay> result = new LinkedHashMap<>();
    if (!ids.isEmpty()) {
      stays.findByReservationIdIn(ids).forEach(s -> result.put(s.getReservationId(), s));
    }
    if (activeStay != null) {
      result.put(activeStay.getReservationId(), activeStay);
    }
    return result;
  }

  private Map<UUID, Room> roomsById(
      List<Reservation> history, Map<UUID, Stay> stayByReservation) {
    Set<UUID> ids = new HashSet<>();
    stayByReservation.values().stream()
        .map(Stay::getRoomId)
        .filter(java.util.Objects::nonNull)
        .forEach(ids::add);
    history.stream().map(Reservation::getRoomId).filter(java.util.Objects::nonNull).forEach(ids::add);
    Map<UUID, Room> result = new LinkedHashMap<>();
    if (!ids.isEmpty()) {
      rooms.findAllById(ids).forEach(r -> result.put(r.getId(), r));
    }
    return result;
  }

  private Map<UUID, RoomCategory> categoriesById(List<Reservation> history) {
    Set<UUID> ids = new HashSet<>();
    history.forEach(r -> ids.add(r.getCategoryId()));
    Map<UUID, RoomCategory> result = new LinkedHashMap<>();
    categories.findAllById(ids).forEach(c -> result.put(c.getId(), c));
    return result;
  }

  private GuestProfileDto.ReservationView toView(
      Reservation reservation,
      Stay stay,
      UUID activeReservationId,
      Map<UUID, Room> roomById,
      Map<UUID, RoomCategory> categoryById) {
    UUID roomId = stay != null ? stay.getRoomId() : reservation.getRoomId();
    Room room = roomId == null ? null : roomById.get(roomId);
    RoomCategory category = categoryById.get(reservation.getCategoryId());
    boolean active = reservation.getId().equals(activeReservationId);
    return new GuestProfileDto.ReservationView(
        reservation.getId(),
        reference(reservation.getId()),
        reservation.getStatus(),
        reservation.getSource(),
        reservation.getCategoryId(),
        category == null ? null : category.getName(),
        reservation.getCheckinDate(),
        reservation.getCheckoutDate(),
        reservation.getNights(),
        roomId,
        room == null ? null : room.getRoomNo(),
        active && room != null ? room.getStatus() : null,
        stay == null ? null : stay.getId(),
        stay == null ? null : stay.getStatus(),
        stay == null ? null : stay.getCheckinAt(),
        stay == null ? null : stay.getCheckoutAt());
  }

  private Folio selectFolio(UUID propertyId, UUID guestId, Stay activeStay) {
    if (activeStay != null) {
      var byStay = folios.findByStayId(activeStay.getId());
      if (byStay.isPresent() && propertyId.equals(byStay.get().getPropertyId())) {
        return byStay.get();
      }
    }
    var open =
        folios.findFirstByPropertyIdAndGuestIdAndStatusOrderByCreatedAtDesc(
            propertyId, guestId, Folio.OPEN);
    if (open.isPresent()) {
      return open.get();
    }
    return folios
        .findFirstByPropertyIdAndGuestIdOrderByCreatedAtDesc(propertyId, guestId)
        .orElse(null);
  }

  private GuestProfileDto.BillingView billing(
      UUID propertyId,
      Folio folio,
      GuestProfileDto.ReservationView currentStay,
      GuestProfileDto.ReservationView nextReservation) {
    long charges = 0;
    long paymentReceived = 0;
    long credits = 0;
    if (folio != null) {
      for (FolioEntry entry : folioService.lines(folio.getId())) {
        if (entry.getAmountPaise() > 0) {
          charges += entry.getAmountPaise();
        } else if ("payment".equals(entry.getSourceType())) {
          paymentReceived += -entry.getAmountPaise();
        } else {
          credits += -entry.getAmountPaise();
        }
      }
    }

    List<Payment> indicators = new ArrayList<>();
    LinkedHashMap<UUID, Payment> unique = new LinkedHashMap<>();
    if (folio != null) {
      payments
          .findTop5ByPropertyIdAndFolioIdAndStatusInOrderByCreatedAtDesc(
              propertyId, folio.getId(), PAYMENT_ALERT_STATUSES)
          .forEach(p -> unique.put(p.getId(), p));
    }
    UUID bookingId =
        currentStay != null
            ? currentStay.reservationId()
            : nextReservation == null ? null : nextReservation.reservationId();
    if (bookingId != null) {
      payments
          .findTop5ByPropertyIdAndBookingIdAndStatusInOrderByCreatedAtDesc(
              propertyId, bookingId, PAYMENT_ALERT_STATUSES)
          .forEach(p -> unique.put(p.getId(), p));
    }
    indicators.addAll(unique.values());
    List<GuestProfileDto.PaymentAlertView> paymentAlerts =
        indicators.stream()
            .limit(ALERT_LIMIT)
            .map(
                p ->
                    new GuestProfileDto.PaymentAlertView(
                        p.getId(), p.getStatus(), p.getAmountPaise(), p.getCreatedAt()))
            .toList();

    GuestProfileDto.InvoiceView invoice = null;
    if (folio != null) {
      Invoice latest =
          invoices.findFirstByFolioIdOrderByIssuedAtDesc(folio.getId()).orElse(null);
      if (latest != null) {
        invoice =
            new GuestProfileDto.InvoiceView(
                latest.getId(), latest.getStatus(), latest.getTotalPaise(),
                latest.getIssuedAt());
      }
    }

    Long advanceDue = null;
    Long advancePaid = null;
    if (folio == null && nextReservation != null) {
      Reservation reservation =
          reservations.findById(nextReservation.reservationId()).orElse(null);
      if (reservation != null) {
        advanceDue = reservation.getAdvanceDuePaise();
        advancePaid = payments.capturedForBooking(reservation.getId());
      }
    }

    return new GuestProfileDto.BillingView(
        folio == null ? null : folio.getId(),
        folio == null ? null : folio.getStayId(),
        folio == null ? null : folio.getStatus(),
        charges,
        paymentReceived,
        credits,
        folio == null ? 0L : folioService.outstanding(folio.getId()),
        advanceDue,
        advancePaid,
        invoice,
        paymentAlerts);
  }

  private List<GuestProfileDto.AlertView> alerts(
      LocalDate today,
      GuestProfileDto.ReservationView currentStay,
      GuestProfileDto.ReservationView nextReservation,
      GuestProfileDto.BillingView billing) {
    List<GuestProfileDto.AlertView> alerts = new ArrayList<>();
    UUID ref = currentStay != null ? currentStay.stayId() : billing.folioId();
    if (currentStay != null && currentStay.checkoutDate().isBefore(today)) {
      alerts.add(
          new GuestProfileDto.AlertView(
              "high", "The stay is past its scheduled checkout date.", currentStay.stayId()));
    }
    boolean departureBalance =
        billing.outstandingPaise() > 0
            && (currentStay == null || !currentStay.checkoutDate().isAfter(today));
    if (departureBalance) {
      alerts.add(
          new GuestProfileDto.AlertView(
              "high", "An outstanding balance remains on the folio.", ref));
    }
    for (GuestProfileDto.PaymentAlertView payment : billing.paymentAlerts()) {
      if (Payment.FAILED.equals(payment.status())) {
        alerts.add(
            new GuestProfileDto.AlertView(
                "high", "A payment attempt failed; collect payment again.", payment.paymentId()));
      } else if (Payment.PENDING.equals(payment.status())) {
        alerts.add(
            new GuestProfileDto.AlertView(
                "info", "A payment is still awaiting confirmation.", payment.paymentId()));
      }
    }
    if (nextReservation != null && nextReservation.checkinDate().equals(today)) {
      alerts.add(
          new GuestProfileDto.AlertView(
              "info", "The guest is due to arrive today.", nextReservation.reservationId()));
    }
    return alerts.stream().limit(ALERT_LIMIT).toList();
  }

  private String operationalState(
      LocalDate today,
      GuestProfileDto.ReservationView currentStay,
      GuestProfileDto.ReservationView nextReservation,
      List<GuestProfileDto.ReservationView> history) {
    if (currentStay != null) {
      return "IN_HOUSE";
    }
    if (nextReservation != null) {
      if (nextReservation.checkinDate().isBefore(today)) {
        return "ARRIVAL_OVERDUE";
      }
      return nextReservation.checkinDate().equals(today) ? "ARRIVING_TODAY" : "UPCOMING";
    }
    if (!history.isEmpty()
        && (Reservation.CHECKED_OUT.equals(history.get(0).status())
            || Stay.CHECKED_OUT.equals(history.get(0).stayStatus()))) {
      return "DEPARTED";
    }
    return history.isEmpty() ? "NO_STAY" : "NO_ACTIVE_STAY";
  }

  private List<GuestProfileDto.PreferenceView> preferences(Guest guest) {
    String raw = guest.getPreferences();
    if (raw == null || raw.isBlank() || "{}".equals(raw.trim())) {
      return List.of();
    }
    try {
      Map<String, Object> parsed =
          objectMapper.readValue(raw, new TypeReference<LinkedHashMap<String, Object>>() {});
      List<GuestProfileDto.PreferenceView> result = new ArrayList<>();
      parsed.forEach(
          (key, value) -> {
            if (key == null || key.isBlank() || value == null) {
              return;
            }
            if (value instanceof String
                || value instanceof Number
                || value instanceof Boolean) {
              result.add(
                  new GuestProfileDto.PreferenceView(
                      key, preferenceLabel(key), preferenceValue(value)));
            }
          });
      return result;
    } catch (Exception invalidJson) {
      return List.of();
    }
  }

  private String preferenceLabel(String key) {
    return switch (key.toLowerCase(Locale.ROOT)) {
      case "diet" -> "Diet";
      case "floor" -> "Floor";
      case "view" -> "View";
      case "room" -> "Room";
      case "pillow" -> "Pillow";
      case "newspaper" -> "Newspaper";
      case "preference" -> "Preference";
      case "special_request", "special-request" -> "Special request";
      default -> titleCase(key.replace('_', ' ').replace('-', ' '));
    };
  }

  private String preferenceValue(Object value) {
    if (value instanceof Boolean bool) {
      return bool ? "Yes" : "No";
    }
    String text = String.valueOf(value).trim();
    if (text.isEmpty()) {
      return text;
    }
    return titleCase(text.replace('_', ' ').replace('-', ' '));
  }

  private String titleCase(String text) {
    String clean = text.trim();
    if (clean.isEmpty()) {
      return clean;
    }
    return clean.substring(0, 1).toUpperCase(Locale.ROOT)
        + clean.substring(1).toLowerCase(Locale.ROOT);
  }

  private String reference(UUID id) {
    return id.toString().substring(0, 8).toUpperCase(Locale.ROOT);
  }
}
