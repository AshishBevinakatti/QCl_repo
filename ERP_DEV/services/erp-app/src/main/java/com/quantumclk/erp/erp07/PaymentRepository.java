package com.quantumclk.erp.erp07;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
