package com.quantumclk.erp.erp07;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-07: payment reads + captured totals per booking. */
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

  Optional<Payment> findByPropertyIdAndIdempotencyKey(UUID propertyId, String idempotencyKey);

  Optional<Payment> findByPropertyIdAndGatewayRef(UUID propertyId, String gatewayRef);

  @Query(
      "SELECT COALESCE(SUM(p.amountPaise), 0) FROM Payment p WHERE p.bookingId = :booking"
          + " AND p.status = 'captured'")
  long capturedForBooking(@Param("booking") UUID bookingId);

  List<Payment> findByPropertyId(UUID propertyId);

  List<Payment> findByBookingId(UUID bookingId);

  /** Guest 360: bounded payment indicators, never a full payment-history load. */
  List<Payment> findTop5ByPropertyIdAndFolioIdAndStatusInOrderByCreatedAtDesc(
      UUID propertyId, UUID folioId, List<String> statuses);

  List<Payment> findTop5ByPropertyIdAndBookingIdAndStatusInOrderByCreatedAtDesc(
      UUID propertyId, UUID bookingId, List<String> statuses);

  /** Serialises confirm/refund processing per payment (double-posting guard). */
  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT p FROM Payment p WHERE p.propertyId = :property AND p.gatewayRef = :ref")
  Optional<Payment> lockByGatewayRef(@Param("property") UUID propertyId,
      @Param("ref") String gatewayRef);
}
