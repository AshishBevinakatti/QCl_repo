package com.quantumclk.erp.erp02;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-02: promo lookup by code (usage-tracked). */
public interface PromoRepository extends JpaRepository<Promo, UUID> {

  Optional<Promo> findByPropertyIdAndCode(UUID propertyId, String code);
}
