package com.quantumclk.erp.erp02;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-02: hold-expiry lookups for the sweeper. */
public interface ReservationHoldRepository extends JpaRepository<ReservationHold, UUID> {

  List<ReservationHold> findByExpiresAtBefore(Instant now);

  void deleteByReservationId(UUID reservationId);
}
