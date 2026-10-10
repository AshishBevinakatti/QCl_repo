package com.quantumclk.erp.erp07;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.config.Configs;
import com.quantumclk.erp.erp05.LoyaltyService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-07: payments + refunds. Webhook-first: a payment captures ONLY on
 * a validly-signed provider callback. Refund processing is row-locked so two
 * concurrent attempts process exactly one (race test proves it).
 */
@Service
public class PaymentService {

  private final PaymentRepository payments;
  private final RefundRepository refunds;
  private final FolioService folio;
  private final PaymentGateway gateway;
  private final LoyaltyService loyalty;
  private final AuditLog auditLog;
  private final Configs configs;

  public PaymentService(
      PaymentRepository payments,
      RefundRepository refunds,
      FolioService folio,
      PaymentGateway gateway,
      LoyaltyService loyalty,
      AuditLog auditLog,
      Configs configs) {
    this.payments = payments;
    this.refunds = refunds;
    this.folio = folio;
    this.gateway = gateway;
    this.loyalty = loyalty;
    this.auditLog = auditLog;
    this.configs = configs;
  }

  /** Start a charge for a booking (advance) or folio; idempotent by key. */
  @Transactional
  public Initiated initiate(UUID propertyId, UUID folioId, UUID bookingId, long amountPaise,
      long expectedAmount, String idempotencyKey, String actor, String ip) {
    if (amountPaise <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be positive");
    }
    if (expectedAmount > 0 && amountPaise != expectedAmount) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount mismatch");
    }
    String key = idempotencyKey == null || idempotencyKey.isBlank() ? UUID.randomUUID().toString()
        : idempotencyKey;
    var replay = payments.findByPropertyIdAndIdempotencyKey(propertyId, key);
    if (replay.isPresent()) {
      Payment existing = replay.get();
      return new Initiated(existing, gateway.sign(existing.getGatewayRef(), existing.getAmountPaise()),
          true);
    }
    String ref = gateway.initiate(propertyId, amountPaise, key);
    Payment payment = payments.save(new Payment(propertyId, folioId, bookingId, amountPaise, ref, key));
    audit(propertyId, actor, "payment.initiated", payment.getId().toString(), null,
        "amount=" + amountPaise, null, ip);
    return new Initiated(payment, gateway.sign(ref, amountPaise), false);
  }

  /**
   * Provider callback (or sandbox simulator): verifies the signature, then
   * captures. Forged callbacks are rejected BEFORE any state changes.
   */
  @Transactional
  public Payment confirmByRef(UUID propertyId, String gatewayRef, String signature, String ip) {
    // Row lock: concurrent callbacks serialize; the loser sees CAPTURED and replays safely.
    Payment payment =
        payments.lockByGatewayRef(propertyId, gatewayRef)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
    if (Payment.CAPTURED.equals(payment.getStatus())) {
      return payment; // provider redelivery: safe replay, no duplicate posting.
    }
    if (!gateway.verifySignature(gatewayRef, payment.getAmountPaise(), signature)) {
      payment.fail();
      payments.save(payment);
      audit(propertyId, "gateway", "payment.signature-rejected", payment.getId().toString(), null,
          null, null, ip);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid webhook signature");
    }
    if (gateway instanceof SandboxGateway sandbox) {
      sandbox.markCaptured(gatewayRef, payment.getAmountPaise());
    }
    payment.capture();
    payments.save(payment);
    if (payment.getFolioId() != null) {
      folio.postEntry(payment.getFolioId(), "payment", payment.getId().toString(),
          -payment.getAmountPaise(), "gateway");
    }
    // Loyalty earn hook (no member / expired member → no earn, by design).
    if (payment.getBookingId() != null) {
      loyalty.earnForBooking(propertyId, payment.getBookingId(), payment.getId(),
          payment.getAmountPaise(), "gateway");
    }
    audit(propertyId, "gateway", "payment.captured", payment.getId().toString(),
        Payment.PENDING, Payment.CAPTURED, null, ip);
    return payment;
  }

  /** Desk/advance settlement used by walk-ins (and tests): initiate + capture atomically. */
  @Transactional
  public Payment sandboxSettle(UUID propertyId, UUID folioId, UUID bookingId, long amountPaise,
      String actor, String ip) {
    Initiated initiated =
        initiate(propertyId, folioId, bookingId, amountPaise, 0, null, actor, ip);
    return confirmByRef(propertyId, initiated.payment().getGatewayRef(), initiated.signature(), ip);
  }

  /** Captured paise for a booking (drives the advance gate in BookingService). */
  @Transactional(readOnly = true)
  public long capturedForBooking(UUID bookingId) {
    return payments.capturedForBooking(bookingId);
  }

  /**
   * Link a booking's captured payments to its folio (called at check-in).
   * The advance collected at booking time then counts against the stay —
   * without this, the folio would ignore money already paid.
   */
  @Transactional
  public void linkBookingPayments(UUID folioId, UUID bookingId, String actor) {
    payments.findByBookingId(bookingId).stream()
        .filter(p -> Payment.CAPTURED.equals(p.getStatus()) && p.getFolioId() == null)
        .forEach(
            payment -> {
              payment.linkFolio(folioId);
              payments.save(payment);
              folio.postEntry(folioId, "payment", payment.getId().toString(),
                  -payment.getAmountPaise(), actor);
            });
  }

  @Transactional
  public Refund requestRefund(UUID propertyId, UUID paymentId, long amountPaise, String reason,
      String idempotencyKey, String actor, String ip) {
    Payment payment =
        payments.findById(paymentId)
            .filter(p -> propertyId.equals(p.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
    if (!Payment.CAPTURED.equals(payment.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "only captured payments refund");
    }
    if (amountPaise <= 0 || amountPaise > payment.getAmountPaise()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "refund amount out of range");
    }
    String key = idempotencyKey == null || idempotencyKey.isBlank() ? UUID.randomUUID().toString()
        : idempotencyKey;
    var replay = refunds.findByPropertyIdAndIdempotencyKey(propertyId, key);
    if (replay.isPresent()) {
      return replay.get();
    }
    Refund refund = refunds.save(new Refund(propertyId, paymentId, amountPaise, reason, key));
    audit(propertyId, actor, "refund.requested", refund.getId().toString(), null,
        "amount=" + amountPaise, reason, ip);
    return refund;
  }

  @Transactional
  public Refund approveRefund(UUID propertyId, UUID refundId, String approver, String ip) {
    Refund refund = ownedRefund(propertyId, refundId);
    if (!Refund.REQUESTED.equals(refund.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "refund is not awaiting approval");
    }
    refund.approve(approver);
    refunds.save(refund);
    audit(propertyId, approver, "refund.approved", refund.getId().toString(), Refund.REQUESTED,
        Refund.APPROVED, null, ip);
    return refund;
  }

  @Transactional
  public Refund processRefund(UUID propertyId, UUID refundId, String actor, String ip) {
    // Row lock: concurrent process attempts serialize; only the first wins.
    Refund refund =
        refunds.lockById(refundId)
            .filter(r -> propertyId.equals(r.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "refund not found"));
    if (Refund.PROCESSED.equals(refund.getStatus())) {
      return refund; // safe replay.
    }
    if (!Refund.APPROVED.equals(refund.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "refund is not approved");
    }
    Payment payment =
        payments.findById(refund.getPaymentId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
    gateway.refund(payment.getGatewayRef(), refund.getAmountPaise(), refund.getId().toString());
    refund.markProcessed();
    refunds.save(refund);
    if (payment.getFolioId() != null) {
      folio.postEntry(payment.getFolioId(), "refund", refund.getId().toString(),
          refund.getAmountPaise(), actor);
    }
    audit(propertyId, actor, "refund.processed", refund.getId().toString(), Refund.APPROVED,
        Refund.PROCESSED, null, ip);
    return refund;
  }

  /** Gateway-vs-internal comparison; mismatches are listed, never silent. */
  @Transactional(readOnly = true)
  public List<ReconLine> reconcile(UUID propertyId) {
    return payments.findByPropertyId(propertyId).stream()
        .map(
            payment -> {
              boolean providerCaptured = gateway.capturedAtProvider(payment.getGatewayRef());
              long providerRefunded = gateway.refundedAtProvider(payment.getGatewayRef());
              boolean internalCaptured = Payment.CAPTURED.equals(payment.getStatus());
              return new ReconLine(
                  payment.getId(), payment.getAmountPaise(), payment.getStatus(),
                  providerCaptured, providerRefunded, internalCaptured == providerCaptured);
            })
        .toList();
  }

  Refund ownedRefund(UUID propertyId, UUID id) {
    return refunds.findById(id)
        .filter(r -> propertyId.equals(r.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "refund not found"));
  }

  void audit(UUID propertyId, String actor, String action, String objectId, String before,
      String after, String reason, String ip) {
    auditLog.append(propertyId, actor, action, "payment", objectId, before, after, reason, ip);
  }

  public record Initiated(Payment payment, String signature, boolean replayed) {}

  public record ReconLine(UUID paymentId, long amountPaise, String internalStatus,
      boolean providerCaptured, long providerRefunded, boolean match) {}
}
