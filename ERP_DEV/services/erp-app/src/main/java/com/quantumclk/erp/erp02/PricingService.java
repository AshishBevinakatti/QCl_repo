package com.quantumclk.erp.erp02;

import com.quantumclk.erp.config.Configs;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-02: pricing engine. Money in paise integers; per-night rounding is
 * DOWN (guest-favourable) — the single rounding policy for booking quotes
 * (billing's invoice rounding lives in 3.4 and is documented there).
 * Rate-plan rows win per night; the flat weekend config is the fallback.
 */
@Service
public class PricingService {

  private static final Set<DayOfWeek> WEEKEND = Set.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY);

  private final RoomCategoryRepository categories;
  private final RatePlanRepository ratePlans;
  private final PromoRepository promos;
  private final Configs configs;

  public PricingService(
      RoomCategoryRepository categories,
      RatePlanRepository ratePlans,
      PromoRepository promos,
      Configs configs) {
    this.categories = categories;
    this.ratePlans = ratePlans;
    this.promos = promos;
    this.configs = configs;
  }

  public Quote quote(
      UUID propertyId, UUID categoryId, LocalDate from, LocalDate to, String promoCode,
      LocalDate today) {
    RoomCategory category =
        categories
            .findById(categoryId)
            .filter(c -> propertyId.equals(c.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
    int upliftPct = configs.getInt("pricing.weekend_uplift_pct", 20);
    long subtotal = 0;
    for (LocalDate night = from; night.isBefore(to); night = night.plusDays(1)) {
      int fallback = WEEKEND.contains(night.getDayOfWeek()) ? 10000 + upliftPct * 100 : 10000;
      int mult = ratePlans.bestMultiplier(propertyId, categoryId, night, fallback);
      subtotal += category.getBasePricePaise() * mult / 10000;
    }
    long discount = 0;
    String applied = null;
    if (promoCode != null && !promoCode.isBlank()) {
      Promo promo =
          promos
              .findByPropertyIdAndCode(propertyId, promoCode.trim())
              .orElseThrow(
                  () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "promo code invalid"));
      if (!promo.usableOn(today)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "promo code expired or fully used");
      }
      discount = subtotal * promo.getPctBps() / 10000;
      applied = promo.getCode();
    }
    long total = subtotal - discount;
    int advancePct = configs.getInt("booking.advance_pct", 30);
    long advance = total * advancePct / 100;
    return new Quote(subtotal, discount, total, advance, applied);
  }

  /** Mark a promo used (called at hold creation; expired/abandoned holds keep the use — MVP rule). */
  public Optional<Promo> consumePromo(UUID propertyId, String promoCode, LocalDate today) {
    if (promoCode == null || promoCode.isBlank()) {
      return Optional.empty();
    }
    Promo promo =
        promos
            .findByPropertyIdAndCode(propertyId, promoCode.trim())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "promo code invalid"));
    if (!promo.usableOn(today)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "promo code expired or fully used");
    }
    promo.recordUse();
    promos.save(promo);
    return Optional.of(promo);
  }

  public record Quote(
      long subtotalPaise, long discountPaise, long totalPaise, long advanceDuePaise,
      String appliedPromo) {}
}
