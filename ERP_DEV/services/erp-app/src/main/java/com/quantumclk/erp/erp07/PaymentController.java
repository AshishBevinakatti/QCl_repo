package com.quantumclk.erp.erp07;

import com.quantumclk.erp.erp02.BookingService;
import com.quantumclk.erp.erp02.Reservation;
import com.quantumclk.erp.erp02.ReservationRepository;
import com.quantumclk.erp.erp02.RoomCategoryController;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-07 (REQ-ERP07-001…006): payments, folios, invoices, refunds,
 * reconciliation. Webhook confirmation is permitAll BY DESIGN — the HMAC
 * signature (not a login) is its authentication.
 */
@RestController
@RequestMapping("/api/v1")
public class PaymentController {

  private final PaymentService payments;
  private final FolioService folio;
  private final FolioRepository folioRepository;
  private final InvoiceService invoices;
  private final InvoiceRepository invoiceRepository;
  private final ReservationRepository reservations;
  private final BookingService bookings;

  public PaymentController(
      PaymentService payments,
      FolioService folio,
      FolioRepository folioRepository,
      InvoiceService invoices,
      InvoiceRepository invoiceRepository,
      ReservationRepository reservations,
      BookingService bookings) {
    this.payments = payments;
    this.folio = folio;
    this.folioRepository = folioRepository;
    this.invoices = invoices;
    this.invoiceRepository = invoiceRepository;
    this.reservations = reservations;
    this.bookings = bookings;
  }

  /** Start a charge: reservation advance (amount defaults to advance_due) or folio top-up. */
  @PreAuthorize("@perm.has('payments:collect')")
  @PostMapping("/payments/initiate")
  @ResponseStatus(HttpStatus.CREATED)
  public InitiateDto initiate(@RequestBody InitiateBody body, HttpServletRequest req) {
    UUID property = RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
    Long amount = body.amount();
    UUID folioId = body.folioId();
    if (body.reservationId() != null) {
      Reservation reservation = bookings.orOwned(property, body.reservationId());
      amount = reservation.getAdvanceDuePaise();
    }
    if (amount == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount or reservationId required");
    }
    PaymentService.Initiated initiated =
        payments.initiate(property, folioId, body.reservationId(), amount, amount,
            body.idempotencyKey(), actor(req), req.getRemoteAddr());
    return new InitiateDto(
        initiated.payment().getId(), initiated.payment().getGatewayRef(),
        initiated.payment().getAmountPaise(), initiated.signature(), initiated.replayed());
  }

  /** Provider callback: verifies the HMAC signature, then captures. */
  @PostMapping("/payments/confirm")
  public PaymentDto confirm(@RequestBody ConfirmBody body, HttpServletRequest req) {
    return toDto(
        payments.confirmByRef(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.gatewayRef(), body.signature(),
            req.getRemoteAddr()));
  }
  @PreAuthorize("@perm.hasAny('payments:collect', 'invoices:manage')")
  @GetMapping("/folios/{id}")
  public FolioDto folio(@PathVariable UUID id) {
    Folio folioAccount =
        folioRepository.findById(id)
            .filter(f -> RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID.equals(f.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "folio not found"));
    List<FolioEntry> lines = folio.lines(id);
    return new FolioDto(
        id, lines.stream().map(e -> new EntryDto(e.getSourceType(), e.getSourceId(),
            e.getAmountPaise())).toList(),
        folio.outstanding(id));
  }

  /** Desk lookup: folio for a stay (or first open folio for a guest). */
  @PreAuthorize("@perm.hasAny('payments:collect', 'invoices:manage')")
  @GetMapping("/folios")
  public FolioDto lookup(
      @RequestParam(required = false) UUID stayId,
      @RequestParam(required = false) UUID guestId) {
    UUID property = RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
    if (stayId != null) {
      return folio(folio.findForStay(stayId)
          .filter(f -> property.equals(f.getPropertyId()))
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "folio not found"))
          .getId());
    }
    if (guestId != null) {
      // Read-only lookup (never creates): first open folio for the guest.
      return folioRepository.findAll().stream()
          .filter(f -> property.equals(f.getPropertyId()) && guestId.equals(f.getGuestId())
              && Folio.OPEN.equals(f.getStatus()))
          .findFirst()
          .map(f -> folio(f.getId()))
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "folio not found"));
    }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "stayId or guestId required");
  }

  @PreAuthorize("@perm.has('invoices:manage')")
  @PostMapping("/folios/{id}/entries")
  public EntryDto postEntry(@PathVariable UUID id, @RequestBody EntryBody body,
      HttpServletRequest req) {
    FolioEntry entry =
        folio.postEntry(id, body.sourceType(), body.sourceId(), body.amountPaise(), actor(req));
    return new EntryDto(entry.getSourceType(), entry.getSourceId(), entry.getAmountPaise());
  }

  @PreAuthorize("@perm.has('invoices:manage')")
  @PostMapping("/invoices")
  @ResponseStatus(HttpStatus.CREATED)
  public InvoiceDto invoice(@RequestBody InvoiceBody body, HttpServletRequest req) {
    Invoice invoice =
        invoices.issue(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.folioId(), actor(req),
            req.getRemoteAddr());
    return new InvoiceDto(invoice.getId(), invoice.getFolioId(), invoice.getTaxPaise(),
        invoice.getTotalPaise(), invoice.getStatus());
  }

  @PreAuthorize("@perm.hasAny('payments:collect', 'invoices:manage')")
  @GetMapping("/invoices/{id}")
  public InvoiceDto getInvoice(@PathVariable UUID id) {
    // Invoices are read-only by design (immutable once issued — no update route exists).
    Invoice invoice =
        invoiceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "invoice not found"));
    return new InvoiceDto(invoice.getId(), invoice.getFolioId(), invoice.getTaxPaise(),
        invoice.getTotalPaise(), invoice.getStatus());
  }

  @PreAuthorize("@perm.has('refunds:manage')")
  @PostMapping("/refunds")
  @ResponseStatus(HttpStatus.CREATED)
  public RefundDto requestRefund(@RequestBody RefundBody body, HttpServletRequest req) {
    Refund refund =
        payments.requestRefund(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.paymentId(),
            body.amountPaise(), body.reason(), body.idempotencyKey(), actor(req),
            req.getRemoteAddr());
    return toRefund(refund);
  }

  @PreAuthorize("@perm.has('refunds:approve')")
  @PostMapping("/refunds/{id}/approve")
  public RefundDto approveRefund(@PathVariable UUID id, HttpServletRequest req) {
    return toRefund(
        payments.approveRefund(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id, actor(req),
            req.getRemoteAddr()));
  }

  @PreAuthorize("@perm.has('refunds:manage')")
  @PostMapping("/refunds/{id}/process")
  public RefundDto processRefund(@PathVariable UUID id, HttpServletRequest req) {
    return toRefund(
        payments.processRefund(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id, actor(req),
            req.getRemoteAddr()));
  }

  @PreAuthorize("@perm.has('reports:financial')")
  @GetMapping("/reconciliation")
  public List<ReconDto> reconcile(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return payments.reconcile(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID).stream()
        .map(r -> new ReconDto(r.paymentId(), r.amountPaise(), r.internalStatus(),
            r.providerCaptured(), r.providerRefunded(), r.match()))
        .toList();
  }

  String actor(HttpServletRequest req) {
    return req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "unknown";
  }

  PaymentDto toDto(Payment payment) {
    return new PaymentDto(payment.getId(), payment.getBookingId(), payment.getAmountPaise(),
        payment.getStatus(), payment.getGatewayRef());
  }

  RefundDto toRefund(Refund refund) {
    return new RefundDto(refund.getId(), refund.getPaymentId(), refund.getAmountPaise(),
        refund.getStatus());
  }

  public record InitiateBody(UUID reservationId, UUID folioId, Long amount, String idempotencyKey) {}

  public record InitiateDto(UUID paymentId, String gatewayRef, long amountPaise, String signature,
      boolean replayed) {}

  public record ConfirmBody(String gatewayRef, String signature) {}

  public record PaymentDto(UUID id, UUID bookingId, long amountPaise, String status,
      String gatewayRef) {}

  public record EntryBody(String sourceType, String sourceId, long amountPaise) {}

  public record EntryDto(String sourceType, String sourceId, long amountPaise) {}

  public record FolioDto(UUID id, List<EntryDto> entries, long outstandingPaise) {}

  public record InvoiceBody(UUID folioId) {}

  public record InvoiceDto(UUID id, UUID folioId, long taxPaise, long totalPaise, String status) {}

  public record RefundBody(UUID paymentId, long amountPaise, String reason, String idempotencyKey) {}

  public record RefundDto(UUID id, UUID paymentId, long amountPaise, String status) {}

  public record ReconDto(UUID paymentId, long amountPaise, String internalStatus,
      boolean providerCaptured, long providerRefunded, boolean match) {}
}
