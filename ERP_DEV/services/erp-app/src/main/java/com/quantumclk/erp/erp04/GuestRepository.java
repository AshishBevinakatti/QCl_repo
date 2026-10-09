package com.quantumclk.erp.erp04;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-04: profile reads keyed by phone (identity) + ranked search. */
public interface GuestRepository extends JpaRepository<Guest, UUID> {

  Optional<Guest> findByPropertyIdAndPhoneAndMergedIntoIsNull(UUID propertyId, String phone);

  @Query(
      "SELECT g FROM Guest g WHERE g.propertyId = :property AND g.mergedInto IS NULL"
          + " AND (LOWER(g.name) LIKE LOWER(CONCAT('%', :q, '%')) OR g.phone LIKE CONCAT('%', :q, '%'))")
  Page<Guest> search(@Param("property") UUID propertyId, @Param("q") String q, Pageable pageable);

  Page<Guest> findByPropertyIdAndMergedIntoIsNull(UUID propertyId, Pageable pageable);
}
