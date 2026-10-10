package com.quantumclk.erp.erp05;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * SOW ERP-05 (REQ-ERP05-001…006): enrollment, dashboard, redeem, adjustments,
 * renewals. Earn fires internally on payment capture (no endpoint — posting
 * points by hand would counterfeit liability).
 */
@RestController
@RequestMapping("/api/v1/members")
public class MemberController {

  private final LoyaltyService loyalty;
  private final MemberRepository members;
  private final LoyaltyLedgerRepository ledger;

  public MemberController(
      LoyaltyService loyalty, MemberRepository members, LoyaltyLedgerRepository ledger) {
    this.loyalty = loyalty;
    this.members = members;
    this.ledger = ledger;
  }

  @PreAuthorize("hasAnyAuthority('RECEPTION','MEMBERSHIP','MANAGER','SUPERADMIN')")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public MemberDto enroll(@RequestBody EnrollBody body, HttpServletRequest req) {
    return toDto(
        loyalty.enroll(
            com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID,
            body.guestId(), actor(req), req.getRemoteAddr()));
  }

  @GetMapping("/{id}")
  public MemberDto dashboard(@PathVariable UUID id) {
    Member member = owned(id);
    return new MemberDto(member.getId(), member.getGuestId(), member.getMembershipNo(),
        member.getTier(), member.getStatus(), member.getValidTo(), loyalty.balance(member.getId()));
  }

  @GetMapping("/{id}/ledger")
  public List<LedgerDto> history(@PathVariable UUID id) {
    Member member = owned(id);
    return ledger.findByMemberIdOrderByCreatedAtAsc(member.getId()).stream()
        .map(e -> new LedgerDto(e.getPointsDelta(), e.getBalanceAfter(), e.getReason()))
        .toList();
  }

  @PreAuthorize("hasAnyAuthority('RECEPTION','MEMBERSHIP','MANAGER','SUPERADMIN','ACCOUNTS')")
  @PostMapping("/{id}/redeem")
  public MemberDto redeem(@PathVariable UUID id, @RequestBody RedeemBody body,
      HttpServletRequest req) {
    int balance =
        loyalty.redeem(
            com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id,
            body.folioId(), body.points(), body.idempotencyKey(), actor(req), req.getRemoteAddr());
    Member member = owned(id);
    return new MemberDto(member.getId(), member.getGuestId(), member.getMembershipNo(),
        member.getTier(), member.getStatus(), member.getValidTo(), balance);
  }

  @PreAuthorize("hasAnyAuthority('MANAGER','SUPERADMIN')")
  @PostMapping("/{id}/adjust")
  public MemberDto adjust(@PathVariable UUID id, @RequestBody AdjustBody body,
      HttpServletRequest req) {
    int balance =
        loyalty.adjust(
            com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id,
            body.delta(), body.reason(), actor(req), req.getRemoteAddr());
    Member member = owned(id);
    return new MemberDto(member.getId(), member.getGuestId(), member.getMembershipNo(),
        member.getTier(), member.getStatus(), member.getValidTo(), balance);
  }

  @PreAuthorize("hasAnyAuthority('MEMBERSHIP','MANAGER','SUPERADMIN')")
  @PostMapping("/{id}/renew")
  public MemberDto renew(@PathVariable UUID id, HttpServletRequest req) {
    Member member =
        loyalty.renew(
            com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, id,
            actor(req), req.getRemoteAddr());
    return new MemberDto(member.getId(), member.getGuestId(), member.getMembershipNo(),
        member.getTier(), member.getStatus(), member.getValidTo(), loyalty.balance(member.getId()));
  }

  Member owned(UUID id) {
    return members.findById(id)
        .filter(m -> com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID
            .equals(m.getPropertyId()))
        .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
            HttpStatus.NOT_FOUND, "member not found"));
  }

  MemberDto toDto(Member member) {
    return new MemberDto(member.getId(), member.getGuestId(), member.getMembershipNo(),
        member.getTier(), member.getStatus(), member.getValidTo(),
        loyalty.balance(member.getId()));
  }

  String actor(HttpServletRequest req) {
    return req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "unknown";
  }

  public record EnrollBody(UUID guestId) {}

  public record RedeemBody(UUID folioId, int points, String idempotencyKey) {}

  public record AdjustBody(int delta, String reason) {}

  public record MemberDto(UUID id, UUID guestId, String membershipNo, String tier, String status,
      LocalDate validTo, int points) {}

  public record LedgerDto(int delta, int balanceAfter, String reason) {}
}
