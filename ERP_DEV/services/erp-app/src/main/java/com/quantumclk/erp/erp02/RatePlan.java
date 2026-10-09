package com.quantumclk.erp.erp02;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

/**
 * SOW ERP-02: seasonal rate multiplier per category (bps: 12000 = +20%).
 * Wins over the flat `pricing.weekend_uplift_pct` config when a plan covers
 * the night; the config remains the fallback (see PricingService).
 */
@Entity
@Table(name = "rate_plan")
public class RatePlan {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Column(name = "category_id", nullable = false)
  private UUID categoryId;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(name = "multiplier_bps", nullable = false)
  private int multiplierBps;

  @Column(name = "dow_mask", nullable = false, length = 50)
  private String dowMask = "MON,TUE,WED,THU,FRI,SAT,SUN";

  @Column(name = "from_date", nullable = false)
  private LocalDate fromDate;

  @Column(name = "to_date", nullable = false)
  private LocalDate toDate;

  protected RatePlan() {}

  public int getMultiplierBps() {
    return multiplierBps;
  }

  /** True when this plan prices the given night (date range + weekday match). */
  public boolean covers(LocalDate night) {
    if (night.isBefore(fromDate) || night.isAfter(toDate)) {
      return false;
    }
    return dowMask.contains(night.getDayOfWeek().name().substring(0, 3));
  }
}
