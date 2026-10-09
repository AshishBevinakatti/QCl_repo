package com.quantumclk.erp.erp02;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-02: room catalogue reads (assignment lives in 3.3 front-office). */
public interface RoomRepository extends JpaRepository<Room, UUID> {

  long countByPropertyIdAndCategoryId(UUID propertyId, UUID categoryId);

  List<Room> findByPropertyIdAndCategoryIdAndStatus(UUID propertyId, UUID categoryId, String status);

  List<Room> findByPropertyId(UUID propertyId);

  /** Serialises check-in/transfer writes per room (the double-assign lock). */
  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT r FROM Room r WHERE r.id = :id")
  Optional<Room> lockById(@Param("id") UUID id);
}
