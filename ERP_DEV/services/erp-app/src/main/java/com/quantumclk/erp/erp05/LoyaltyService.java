package com.quantumclk.erp.erp05;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.config.Configs;
import com.quantumclk.erp.erp02.ReservationRepository;
import com.quantumclk.erp.erp04.GuestRepository;
import com.quantumclk.erp.erp07.FolioService;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-05: tiers, earn, redeem, validity, adjustments. The ledger is the
 * truth (balances derived); member rows carry status/tier only. Earn fires on
 * payment capture, idempotent by payment id; concurrent earn/redeem
 * serializes on the member row lock.
 */
@Service
public class LoyaltyService {

  private final MemberRepository members;
  private final LoyaltyLedgerRepository ledger;
  private final TierRuleRepository tiers;
  private final GuestRepository guests;
  private final ReservationRepository reservations;
  private final FolioService folio;
  private final AuditLog auditLog;
  private final Configs configs;

  public LoyaltyService(
      MemberRepository members,
      LoyaltyLedgerRepository ledger,
      TierRuleRepository tiers,
      GuestRepository guests,
      ReservationRepository reservations,
      FolioService folio,
      AuditLog auditLog,
      Configs configs) {
    this.members = members;
    this.ledger = ledger;
    this.tiers = tiers;
    this.guests = guests;
    this.reservations = reservations;
    this.folio = folio;
    this.auditLog = auditLog;
    this.configs = configs;
  }

  @Transactional
  public Member enroll(UUID propertyId, UUID guestId, String actor, String ip) {
    guests.findById(guestId)
        .filter(g -> propertyId.equals(g.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "guest not found"));
    if (members.findByPropertyIdAndGuestId(propertyId, guestId).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "guest is already a member");
    }
    LocalDate today = LocalDate.now();
    int validityDays = configs.getInt("membership.validity_days", 365);
    Member member =
        new Member(propertyId, guestId,
            "GHM-" + today.getYear() + "-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(),
            today, today.plusDays(validityDays));
    members.save(member);
    audit(propertyId, actor, "member.enrolled", member.getId().toString(), null,
        member.getMembershipNo(), null, ip);
    return member;
  }

  /**
   * Earn hook (called on payment capture): 1pt per Rs 100 paid, floored.
   * No member / expired member → no earn (returns 0). Idempotent per payment.
   */
  @Transactional
  public int earnForBooking(UUID propertyId, UUID bookingId, UUID paymentId, long amountPaise,
      String actor) {
    var reservation =
        reservations.findById(bookingId)
            .filter(r -> propertyId.equals(r.getPropertyId()))
            .orElse(null);
    if (reservation == null) {
      return 0;
    }
    Member member =
        members.findByPropertyIdAndGuestId(propertyId, reservation.getGuestId()).orElse(null);
    if (member == null || !Member.ACTIVE.equals(member.getStatus())
        || member.getValidTo().isBefore(LocalDate.now())) {
      return 0;
    }
    if (ledger.findByMemberIdAndRefTypeAndRefId(member.getId(), "payment", paymentId.toString())
        .isPresent()) {
      return ledger.balance(member.getId()); // provider redelivery: safe replay.
    }
    Member locked = members.lockById(member.getId()).orElseThrow();
    int rate = earnRate(locked.getTier());
    int points = (int) (amountPaise / 100 * rate / 100);
    if (points <= 0) {
      return ledger.balance(locked.getId());
    }
    int balance = ledger.balance(locked.getId());
    try {
      ledger.saveAndFlush(new LoyaltyLedger(locked.getId(), points, balance + points,
          "earn on payment", "payment", paymentId.toString(), actor));
    } catch (org.springframework.dao.DataIntegrityViolationException race) {
      // Lost the concurrent-earn race after locking different rows: the winner's
      // row is the truth — replay safely (proven by EarnRaceTest).
      return ledger.balance(locked.getId());
    }
    maybeUpgrade(propertyId, locked);
    audit(propertyId, actor, "points.earned", locked.getId().toString(), String.valueOf(balance),
        String.valueOf(balance + points), null, null);
    return balance + points;
  }

  /**
   * Redeem points as folio credit (100pts = Rs 100). Capped at 50% of the
   * folio outstanding per use ([ASSUMED] liability guard). Idempotent by key.
   */
  @Transactional
  public int redeem(UUID propertyId, UUID memberId, UUID folioId, int points, String idempotencyKey,
      String actor, String ip) {
    if (points <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "points must be positive");
    }
    Member locked =
        members.lockById(memberId)
            .filter(m -> propertyId.equals(m.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "member not found"));
    if (!Member.ACTIVE.equals(locked.getStatus())
        || locked.getValidTo().isBefore(LocalDate.now())) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "membership is not active");
    }
    String key = idempotencyKey == null || idempotencyKey.isBlank() ? UUID.randomUUID().toString()
        : idempotencyKey;
    var replay = ledger.findByMemberIdAndRefTypeAndRefId(locked.getId(), "redeem", key);
    if (replay.isPresent()) {
      return ledger.balance(locked.getId());
    }
    int balance = ledger.balance(locked.getId());
    if (balance < points) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "insufficient points");
    }
    long valuePaise = points * 100L; // 100pts = Rs 100 = 10000 paise → 1pt = 100 paise.
    long outstanding = folio.outstanding(folioId);
    if (valuePaise * 2 > outstanding) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "redemption capped at 50% of folio outstanding per use");
    }
    folio.postEntry(folioId, "loyalty", locked.getId().toString(), -valuePaise, actor);
    ledger.save(new LoyaltyLedger(locked.getId(), -points, balance - points, "redeem to folio",
        "redeem", key, actor));
    audit(propertyId, actor, "points.redeemed", locked.getId().toString(), String.valueOf(balance),
        String.valueOf(balance - points), null, ip);
    return balance - points;
  }

  /** Manual adjustment (approved roles only — enforced at the controller). */
  @Transactional
  public int adjust(UUID propertyId, UUID memberId, int delta, String reason, String actor,
      String ip) {
    if (reason == null || reason.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "adjustment reason required");
    }
    Member locked =
        members.lockById(memberId)
            .filter(m -> propertyId.equals(m.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "member not found"));
    int balance = ledger.balance(locked.getId());
    if (balance + delta < 0) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "adjustment overdraws balance");
    }
    ledger.save(new LoyaltyLedger(locked.getId(), delta, balance + delta, "manual: " + reason,
        "manual", UUID.randomUUID().toString(), actor));
    maybeUpgrade(propertyId, locked);
    audit(propertyId, actor, "points.adjusted", locked.getId().toString(), String.valueOf(balance),
        String.valueOf(balance + delta), reason, ip);
    return balance + delta;
  }

  @Transactional
  public Member renew(UUID propertyId, UUID memberId, String actor, String ip) {
    Member locked =
        members.lockById(memberId)
            .filter(m -> propertyId.equals(m.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "member not found"));
    int validityDays = configs.getInt("membership.validity_days", 365);
    LocalDate today = LocalDate.now();
    LocalDate base = locked.getValidTo().isAfter(today) ? locked.getValidTo() : today;
    locked.renew(base.plusDays(validityDays));
    members.save(locked);
    audit(propertyId, actor, "member.renewed", locked.getId().toString(), null,
        locked.getValidTo().toString(), null, ip);
    return locked;
  }

  /** Nightly net: expire lapsed memberships (points die with status — finance to confirm at UAT). */
  @Transactional
  public int expireMembers(UUID propertyId, LocalDate today, String ip) {
    List<Member> lapsed =
        members.findByPropertyIdAndStatusAndValidToBefore(propertyId, Member.ACTIVE, today);
    for (Member member : lapsed) {
      member.expire();
      members.save(member);
      audit(propertyId, "system", "member.expired", member.getId().toString(), Member.ACTIVE,
          Member.EXPIRED, null, ip);
    }
    return lapsed.size();
  }

  /** Tier upgrade on lifetime earned points (≈ spend/100 at rate 1 — documented approximation). */
  void maybeUpgrade(UUID propertyId, Member member) {
    long lifetime =
        ledger.findByMemberIdOrderByCreatedAtAsc(member.getId()).stream()
            .filter(e -> e.getPointsDelta() > 0)
            .mapToLong(LoyaltyLedger::getPointsDelta)
            .sum();
    String best = "Silver";
    for (TierRule rule : tiers.findAllByOrderByMinSpendPaiseAsc()) {
      if (lifetime >= rule.getMinSpendPaise() / 100) {
        best = rule.getTier();
      }
    }
    if (!best.equals(member.getTier())) {
      String before = member.getTier();
      member.setTier(best);
      members.save(member);
      audit(propertyId, "system", "member.tier-changed", member.getId().toString(), before, best,
          null, null);
    }
  }

  int earnRate(String tier) {
    return tiers.findById(tier).map(TierRule::getEarnPerRs100).orElse(1);
  }

  public int balance(UUID memberId) {
    return ledger.balance(memberId);
  }

  void audit(UUID propertyId, String actor, String action, String objectId, String before,
      String after, String reason, String ip) {
    auditLog.append(propertyId, actor, action, "member", objectId, before, after, reason, ip);
  }
}
