package com.quantumclk.erp.erp03;

import com.quantumclk.erp.erp02.Reservation;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
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

  /** Guest 360: batch stay lookup for a bounded reservation page (no N+1). */
  List<Stay> findByReservationIdIn(Collection<UUID> reservationIds);

  /** Guest 360: active stay owned by the guest, newest first. */
  @Query(
      "SELECT s FROM Stay s JOIN Reservation r ON s.reservationId = r.id"
          + " WHERE s.propertyId = :property AND r.guestId = :guest"
          + " AND s.status = 'checked-in' ORDER BY s.checkinAt DESC, s.id DESC")
  List<Stay> findCheckedInByGuest(
      @Param("property") UUID propertyId, @Param("guest") UUID guestId, Pageable pageable);
}
