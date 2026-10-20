package com.quantumclk.erp.erp02;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-02: overlap counting is the availability engine's core query. */
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

  /** Active holds on a category pool (states that consume inventory). */
  List<String> ACTIVE = List.of(Reservation.HOLD, Reservation.CONFIRMED, Reservation.CHECKED_IN);

  @Query(
      "SELECT COUNT(r) FROM Reservation r WHERE r.propertyId = :property"
          + " AND r.categoryId = :category AND r.status IN :active"
          + " AND r.checkinDate < :to AND r.checkoutDate > :from"
          + " AND (:exclude IS NULL OR r.id <> :exclude)")
  long countOverlapping(
      @Param("property") UUID propertyId,
      @Param("category") UUID categoryId,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to,
      @Param("active") List<String> active,
      @Param("exclude") UUID exclude);

  default long countOverlapping(UUID propertyId, UUID categoryId, LocalDate from, LocalDate to) {
    return countOverlapping(propertyId, categoryId, from, to, ACTIVE, null);
  }

  Optional<Reservation> findByPropertyIdAndIdempotencyKey(UUID propertyId, String idempotencyKey);

  @Query(
      "SELECT r FROM Reservation r WHERE r.propertyId = :property"
          + " AND (:status IS NULL OR r.status = :status)"
          + " AND (CAST(:date AS DATE) IS NULL OR (r.checkinDate <= :date AND r.checkoutDate > :date))")
  Page<Reservation> dashboard(
      @Param("property") UUID propertyId,
      @Param("date") LocalDate date,
      @Param("status") String status,
      Pageable pageable);

  /**
   * 3.8 arrivals semantics: a confirmed booking whose check-in day IS the date
   * (the guest is expected today). Mid-stay bookings are in-house, not arrivals —
   * the overlap query above stays for bookings-on-date lists.
   */
  @Query(
      "SELECT r FROM Reservation r WHERE r.propertyId = :property"
          + " AND r.status = :status AND r.checkinDate = :date")
  Page<Reservation> arrivingOn(
      @Param("property") UUID propertyId,
      @Param("date") LocalDate date,
      @Param("status") String status,
      Pageable pageable);

  /**
   * 3.8 short-ref search: every screen shows the 8-char booking ref, so users
   * type/paste that. Prefix match on the casted id — portable SQL (Postgres + H2).
   */
  @Query(
      "SELECT r FROM Reservation r WHERE r.propertyId = :property"
          + " AND LOWER(CAST(r.id AS String)) LIKE :prefix"
          + " ORDER BY r.checkinDate DESC")
  Page<Reservation> searchByRefPrefix(
      @Param("property") UUID propertyId, @Param("prefix") String prefix, Pageable pageable);
}
