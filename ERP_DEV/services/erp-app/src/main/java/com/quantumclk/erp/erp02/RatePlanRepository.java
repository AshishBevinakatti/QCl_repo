package com.quantumclk.erp.erp02;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-02: rate plans per category (highest covering multiplier wins). */
public interface RatePlanRepository extends JpaRepository<RatePlan, UUID> {

  List<RatePlan> findByPropertyIdAndCategoryId(UUID propertyId, UUID categoryId);

  default int bestMultiplier(UUID propertyId, UUID categoryId, LocalDate night, int fallbackBps) {
    int best = fallbackBps;
    for (RatePlan plan : findByPropertyIdAndCategoryId(propertyId, categoryId)) {
      if (plan.covers(night) && plan.getMultiplierBps() > best) {
        best = plan.getMultiplierBps();
      }
    }
    return best;
  }
}
