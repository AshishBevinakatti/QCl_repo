package com.quantumclk.erp.erp03;

import com.quantumclk.erp.erp02.Reservation;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-03: stay reads + the room-level overlap guard query. */
public interface StayRepository extends JpaRepository<Stay, UUID> {

  Optional<Stay> findByReservationId(UUID reservationId);

  /** Active stays on a room overlapping [from, to) — the double-assign guard. */
  @Query(
      "SELECT COUNT(s) FROM Stay s JOIN Reservation r ON s.reservationId = r.id"
          + " WHERE s.roomId = :room AND s.status = 'checked-in'"
          + " AND r.checkinDate < :to AND r.checkoutDate > :from"
          + " AND (:exclude IS NULL OR s.id <> :exclude)")
  long countOverlapping(
      @Param("room") UUID roomId,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to,
      @Param("exclude") UUID excludeStayId);

  @Query(
      "SELECT s FROM Stay s JOIN Reservation r ON s.reservationId = r.id"
          + " WHERE s.propertyId = :property AND s.status = 'checked-in'")
  java.util.List<Stay> findCheckedIn(@Param("property") UUID propertyId);
}
