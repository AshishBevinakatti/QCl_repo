package com.quantumclk.erp.erp07;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-07: refund reads + row lock for the double-refund race. */
public interface RefundRepository extends JpaRepository<Refund, UUID> {

  Optional<Refund> findByPropertyIdAndIdempotencyKey(UUID propertyId, String idempotencyKey);

  List<Refund> findByPaymentId(UUID paymentId);

  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT r FROM Refund r WHERE r.id = :id")
  Optional<Refund> lockById(@Param("id") UUID id);
}
