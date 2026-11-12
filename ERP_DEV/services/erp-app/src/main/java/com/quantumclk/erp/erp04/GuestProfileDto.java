package com.quantumclk.erp.erp04;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Guest 360 read model. DTOs only: the receptionist receives the operational
 * facts they need, never persistence entities, raw JSON or payment credentials.
 */
public record GuestProfileDto(
    GuestView guest,
    MemberView membership,
    ReservationView currentStay,
    ReservationView nextReservation,
    String operationalState,
    List<ReservationView> reservations,
    int reservationTotal,
    BillingView billing,
    List<AlertView> alerts,
    List<PreferenceView> preferences) {

  public record GuestView(
      UUID id,
      String name,
      String phone,
      String email,
      String idType,
      String status,
      UUID memberId) {}

  public record MemberView(
      UUID id,
      String membershipNo,
      String tier,
      String status,
      LocalDate validFrom,
      LocalDate validTo,
      int points) {}

  /**
   * One reservation with its optional stay. `roomStatus` is only current-state
   * information and is therefore populated for the active stay, not history.
   */
  public record ReservationView(
      UUID reservationId,
      String reference,
      String status,
      String source,
      UUID categoryId,
      String categoryName,
      LocalDate checkinDate,
      LocalDate checkoutDate,
      int nights,
      UUID roomId,
      String roomNo,
      String roomStatus,
      UUID stayId,
      String stayStatus,
      Instant checkinAt,
      Instant checkoutAt) {}

  public record BillingView(
      UUID folioId,
      UUID stayId,
      String status,
      long chargesPaise,
      long paymentsPaise,
      long creditsPaise,
      long outstandingPaise,
      Long advanceDuePaise,
      Long advancePaidPaise,
      InvoiceView invoice,
      List<PaymentAlertView> paymentAlerts) {}

  public record InvoiceView(
      UUID id, String status, long totalPaise, Instant issuedAt) {}

  public record PaymentAlertView(
      UUID paymentId, String status, long amountPaise, Instant createdAt) {}

  public record AlertView(String severity, String text, UUID ref) {}

  public record PreferenceView(String key, String label, String value) {}
}
